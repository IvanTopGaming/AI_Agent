package com.mycompany.ai_agent.repository;

import com.mycompany.ai_agent.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {
}