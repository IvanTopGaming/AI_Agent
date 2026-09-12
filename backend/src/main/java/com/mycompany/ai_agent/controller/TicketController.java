package com.mycompany.ai_agent.controller;

import com.mycompany.ai_agent.dto.CreateTicketRequest;
import com.mycompany.ai_agent.dto.TicketResponse;
import com.mycompany.ai_agent.service.TicketService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping
    public ResponseEntity<TicketResponse> createTicket(
            @RequestBody CreateTicketRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ticketService.create(request));
    }
}