package com.mycompany.ai_agent.controller;

import com.mycompany.ai_agent.dto.FeedbackRequest;
import com.mycompany.ai_agent.service.TicketService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/messages")
public class FeedbackController {

    private final TicketService ticketService;

    public FeedbackController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping("/{messageId}/feedback")
    public ResponseEntity<Void> feedback(
            @PathVariable UUID messageId,
            @Valid @RequestBody FeedbackRequest request
    ) {
        ticketService.saveFeedback(messageId, request);
        return ResponseEntity.noContent().build();
    }
}
