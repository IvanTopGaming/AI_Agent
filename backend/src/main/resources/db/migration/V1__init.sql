CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE ticket_category AS ENUM (
    'technical',
    'billing',
    'bug',
    'integration',
    'general'
);

CREATE TYPE ticket_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);

CREATE TYPE ticket_status AS ENUM (
    'open',
    'ai_processing',
    'ai_answered',
    'resolved',
    'escalated'
);

CREATE TYPE message_role AS ENUM (
    'user',
    'assistant',
    'system'
);

CREATE TYPE message_status AS ENUM (
    'queued',
    'streaming',
    'completed',
    'failed'
);

CREATE TYPE ai_run_status AS ENUM (
    'queued',
    'running',
    'completed',
    'failed',
    'cancelled'
);

CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id text UNIQUE,
    email text UNIQUE,
    display_name text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number bigint GENERATED ALWAYS AS IDENTITY (START WITH 1000),
    requester_id uuid REFERENCES users(id) ON DELETE SET NULL,
    title varchar(100) NOT NULL,
    description text NOT NULL,
    category varchar(20) NOT NULL,
    priority varchar(20) NOT NULL DEFAULT 'medium',
    status varchar(20) NOT NULL DEFAULT 'open',
    assigned_operator_id uuid REFERENCES users(id) ON DELETE SET NULL,
    resolved_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT tickets_ticket_number_unique UNIQUE (ticket_number),
    CONSTRAINT tickets_title_not_blank CHECK (length(btrim(title)) > 0),
    CONSTRAINT tickets_description_not_blank CHECK (length(btrim(description)) > 0),
    CONSTRAINT tickets_category_check CHECK (category IN ('technical', 'billing', 'bug', 'integration', 'general')),
    CONSTRAINT tickets_priority_check CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    CONSTRAINT tickets_status_check CHECK (status IN ('open', 'ai_processing', 'ai_answered', 'resolved', 'escalated')),
    CONSTRAINT tickets_resolved_at_check CHECK (
        status <> 'resolved' OR resolved_at IS NOT NULL
    )
);

CREATE TABLE messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    author_id uuid REFERENCES users(id) ON DELETE SET NULL,
    role varchar(20) NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'completed',
    content text NOT NULL DEFAULT '',
    format varchar(20) NOT NULL DEFAULT 'markdown',
    error_code text,
    error_message text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    CONSTRAINT messages_format_check CHECK (format IN ('plain', 'markdown')),
    CONSTRAINT messages_role_check CHECK (role IN ('user', 'assistant', 'system')),
    CONSTRAINT messages_status_check CHECK (status IN ('queued', 'streaming', 'completed', 'failed'))
);

CREATE TABLE attachments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
    storage_key text NOT NULL UNIQUE,
    original_name text NOT NULL,
    content_type text NOT NULL,
    size_bytes bigint NOT NULL,
    checksum_sha256 varchar(64),
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz,
    CONSTRAINT attachments_size_check CHECK (size_bytes > 0)
);

CREATE TABLE ticket_attachments (
    ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    attachment_id uuid NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (ticket_id, attachment_id),
    CONSTRAINT ticket_attachments_attachment_unique UNIQUE (attachment_id)
);

CREATE TABLE message_attachments (
    message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    attachment_id uuid NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (message_id, attachment_id),
    CONSTRAINT message_attachments_attachment_unique UNIQUE (attachment_id)
);

CREATE TABLE message_feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    rating smallint NOT NULL,
    comment text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT message_feedback_rating_check CHECK (rating IN (-1, 1)),
    CONSTRAINT message_feedback_message_unique UNIQUE (message_id)
);

CREATE TABLE ticket_status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    previous_status ticket_status,
    next_status ticket_status NOT NULL,
    changed_by uuid REFERENCES users(id) ON DELETE SET NULL,
    reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ticket_status_changed_check CHECK (
        previous_status IS NULL OR previous_status <> next_status
    )
);

CREATE TABLE ai_runs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    request_message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
    response_message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
    provider text NOT NULL,
    model text NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'queued',
    prompt_tokens integer,
    completion_tokens integer,
    error_code text,
    error_message text,
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ai_runs_prompt_tokens_check CHECK (
        prompt_tokens IS NULL OR prompt_tokens >= 0
    ),
    CONSTRAINT ai_runs_completion_tokens_check CHECK (
        completion_tokens IS NULL OR completion_tokens >= 0
    ),
    CONSTRAINT ai_runs_status_check CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled'))
);

CREATE TABLE stream_events (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    payload text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT stream_events_type_check CHECK (
        event_type IN (
            'message.started',
            'message.delta',
            'message.completed',
            'message.failed',
            'ticket.updated'
        )
    )
);

CREATE INDEX tickets_requester_created_idx
    ON tickets (requester_id, created_at DESC);

CREATE INDEX tickets_status_priority_idx
    ON tickets (status, priority, created_at DESC);

CREATE INDEX tickets_operator_status_idx
    ON tickets (assigned_operator_id, status)
    WHERE assigned_operator_id IS NOT NULL;

CREATE INDEX messages_ticket_created_idx
    ON messages (ticket_id, created_at, id);

CREATE INDEX attachments_owner_created_idx
    ON attachments (owner_id, created_at DESC);

CREATE INDEX ticket_status_history_ticket_created_idx
    ON ticket_status_history (ticket_id, created_at DESC);

CREATE INDEX ai_runs_ticket_created_idx
    ON ai_runs (ticket_id, created_at DESC);

CREATE INDEX ai_runs_active_idx
    ON ai_runs (status, created_at)
    WHERE status IN ('queued', 'running');

CREATE INDEX stream_events_ticket_id_idx
    ON stream_events (ticket_id, id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER tickets_set_updated_at
BEFORE UPDATE ON tickets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER messages_set_updated_at
BEFORE UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER message_feedback_set_updated_at
BEFORE UPDATE ON message_feedback
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
