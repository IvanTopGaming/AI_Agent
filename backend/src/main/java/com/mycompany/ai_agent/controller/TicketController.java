package com.mycompany.ai_agent.controller;

import com.mycompany.ai_agent.dto.CreateMessageRequest;
import com.mycompany.ai_agent.dto.CreateMessageResponse;
import com.mycompany.ai_agent.dto.CreateTicketRequest;
import com.mycompany.ai_agent.dto.MessageListResponse;
import com.mycompany.ai_agent.dto.TicketResponse;
import com.mycompany.ai_agent.dto.UpdateTicketRequest;
import com.mycompany.ai_agent.service.TicketEventService;
import com.mycompany.ai_agent.service.TicketService;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import javax.validation.Valid;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tickets")
public class TicketController {

    private final TicketService ticketService;
    private final TicketEventService eventService;

    public TicketController(TicketService ticketService, TicketEventService eventService) {
        this.ticketService = ticketService;
        this.eventService = eventService;
    }

    @PostMapping
    public ResponseEntity<TicketResponse> createTicket(@Valid @RequestBody CreateTicketRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.create(request));
    }

    @GetMapping("/{ticketId}")
    public TicketResponse getTicket(@PathVariable UUID ticketId) {
        return ticketService.get(ticketId);
    }

    @GetMapping("/{ticketId}/messages")
    public MessageListResponse getMessages(
            @PathVariable UUID ticketId,
            @RequestParam(required = false) UUID cursor,
            @RequestParam(defaultValue = "50") int limit
    ) {
        return ticketService.getMessages(ticketId, cursor, limit);
    }

    @PostMapping("/{ticketId}/messages")
    public ResponseEntity<CreateMessageResponse> createMessage(
            @PathVariable UUID ticketId,
            @Valid @RequestBody CreateMessageRequest request
    ) {
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(ticketService.createMessage(ticketId, request));
    }

    @PatchMapping("/{ticketId}")
    public TicketResponse updateTicket(
            @PathVariable UUID ticketId,
            @Valid @RequestBody UpdateTicketRequest request
    ) {
        return ticketService.update(ticketId, request);
    }

    @GetMapping(value = "/{ticketId}/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> events(
            @PathVariable UUID ticketId,
            @RequestHeader(name = "Last-Event-ID", required = false) Long lastEventId
    ) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noCache())
                .header(HttpHeaders.CONNECTION, "keep-alive")
                .header("X-Accel-Buffering", "no")
                .body(eventService.subscribe(ticketId, lastEventId));
    }
}
