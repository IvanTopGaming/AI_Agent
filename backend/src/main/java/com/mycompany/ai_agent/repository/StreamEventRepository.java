package com.mycompany.ai_agent.repository;

import com.mycompany.ai_agent.entity.StreamEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface StreamEventRepository extends JpaRepository<StreamEvent, Long> {

    List<StreamEvent> findByTicketIdAndIdGreaterThanOrderByIdAsc(UUID ticketId, Long id);
}
