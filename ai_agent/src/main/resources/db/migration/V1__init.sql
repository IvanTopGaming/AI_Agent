CREATE SEQUENCE request_seq;
CREATE SEQUENCE message_seq;

CREATE TABLE requests (
	id BIGINT PRIMARY KEY DEFAULT nextval('request_seq'),
	user_uid VARCHAR(255) NOT NULL,
	title VARCHAR(255) NOT NULL,
	description VARCHAR(255) NOT NULL,
	status VARCHAR(255) NOT NULL,
	category VARCHAR(255) NOT NULL
);

CREATE TABLE messages (
	id BIGINT PRIMARY KEY DEFAULT nextval('message_seq'),
	author VARCHAR(255) NOT NULL,
	body VARCHAR(255) NOT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	
	request_id BIGINT NOT NULL,
	
	CONSTRAINT fk_task_project
        FOREIGN KEY (request_id)
        REFERENCES requests(id)
);
