package com.mycompany.ai_agent.service;

import com.mycompany.ai_agent.dto.CreateTicketRequest;
import com.mycompany.ai_agent.dto.TicketResponse;
import com.mycompany.ai_agent.entity.Ticket;
import com.mycompany.ai_agent.repository.TicketRepository;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;

    public TicketService(TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    public TicketResponse create(CreateTicketRequest request) {

        Ticket ticket = new Ticket();

        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setCategory(request.getCategory());
        ticket.setPriority(
                request.getPriority() != null
                        ? request.getPriority()
                        : "medium"
        );
        ticket.setStatus("open");

        ticket.setCreatedAt(OffsetDateTime.now());
        ticket.setUpdatedAt(OffsetDateTime.now());

        Ticket saved = ticketRepository.save(ticket);

        return new TicketResponse(
                saved.getId(),
                saved.getTicketNumber(),
                saved.getTitle(),
                saved.getDescription(),
                saved.getCategory(),
                saved.getPriority(),
                saved.getStatus(),
                saved.getCreatedAt(),
                saved.getUpdatedAt()
        );
    }
}