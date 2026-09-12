ALTER TABLE ticket_status_history
    ALTER COLUMN previous_status TYPE varchar(20) USING previous_status::text,
    ALTER COLUMN next_status TYPE varchar(20) USING next_status::text;

ALTER TABLE ticket_status_history
    ADD CONSTRAINT ticket_status_history_previous_status_check CHECK (
        previous_status IS NULL OR previous_status IN ('open', 'ai_processing', 'ai_answered', 'resolved', 'escalated')
    ),
    ADD CONSTRAINT ticket_status_history_next_status_check CHECK (
        next_status IN ('open', 'ai_processing', 'ai_answered', 'resolved', 'escalated')
    );
