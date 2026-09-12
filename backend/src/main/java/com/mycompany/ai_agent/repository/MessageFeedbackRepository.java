package com.mycompany.ai_agent.repository;

import com.mycompany.ai_agent.entity.MessageFeedback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;
import java.util.Optional;

public interface MessageFeedbackRepository
        extends JpaRepository<MessageFeedback, UUID> {

    Optional<MessageFeedback> findByMessageId(UUID messageId);
}
