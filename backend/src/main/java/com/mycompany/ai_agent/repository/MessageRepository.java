package com.mycompany.ai_agent.repository;

import com.mycompany.ai_agent.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    List<Message> findByTicketIdOrderByCreatedAtAsc(UUID ticketId);

    List<Message> findByTicketIdOrderByCreatedAtAscIdAsc(UUID ticketId, Pageable pageable);

    Optional<Message> findByIdAndTicketId(UUID id, UUID ticketId);

    @Query("select m from Message m where m.ticket.id = :ticketId and " +
            "(m.createdAt > :createdAt or (m.createdAt = :createdAt and m.id > :id)) " +
            "order by m.createdAt asc, m.id asc")
    List<Message> findPageAfter(
            @Param("ticketId") UUID ticketId,
            @Param("createdAt") java.time.OffsetDateTime createdAt,
            @Param("id") UUID id,
            Pageable pageable
    );
}
