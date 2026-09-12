package com.mycompany.ai_agent.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mycompany.ai_agent.entity.StreamEvent;
import com.mycompany.ai_agent.entity.Ticket;
import com.mycompany.ai_agent.exception.ApiException;
import com.mycompany.ai_agent.repository.StreamEventRepository;
import com.mycompany.ai_agent.repository.TicketRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class TicketEventService {

    private final StreamEventRepository streamEventRepository;
    private final TicketRepository ticketRepository;
    private final ObjectMapper objectMapper;
    private final ConcurrentHashMap<UUID, CopyOnWriteArrayList<SseEmitter>> subscribers = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<UUID, Object> locks = new ConcurrentHashMap<>();

    public TicketEventService(
            StreamEventRepository streamEventRepository,
            TicketRepository ticketRepository,
            ObjectMapper objectMapper
    ) {
        this.streamEventRepository = streamEventRepository;
        this.ticketRepository = ticketRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public SseEmitter subscribe(UUID ticketId, Long lastEventId) {
        if (!ticketRepository.existsById(ticketId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "TICKET_NOT_FOUND", "Обращение не найдено");
        }

        SseEmitter emitter = new SseEmitter(30L * 60L * 1000L);
        CopyOnWriteArrayList<SseEmitter> ticketSubscribers = subscribers.computeIfAbsent(ticketId, ignored -> new CopyOnWriteArrayList<>());
        Object lock = locks.computeIfAbsent(ticketId, ignored -> new Object());
        synchronized (lock) {
            ticketSubscribers.add(emitter);
            List<StreamEvent> missedEvents = streamEventRepository.findByTicketIdAndIdGreaterThanOrderByIdAsc(ticketId, lastEventId == null ? 0L : lastEventId);
            missedEvents.forEach(event -> send(emitter, event));
        }

        Runnable remove = () -> remove(ticketId, emitter);
        emitter.onCompletion(remove);
        emitter.onTimeout(remove);
        emitter.onError(ignored -> remove.run());
        return emitter;
    }

    @Transactional
    public StreamEvent publish(Ticket ticket, String eventType, Object payload) {
        StreamEvent event = new StreamEvent();
        event.setTicket(ticket);
        event.setEventType(eventType);
        event.setPayload(toJson(payload));
        event.setCreatedAt(OffsetDateTime.now());
        StreamEvent saved = streamEventRepository.saveAndFlush(event);

        Runnable broadcast = () -> broadcast(ticket.getId(), saved);
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    broadcast.run();
                }
            });
        } else {
            broadcast.run();
        }
        return saved;
    }

    private void broadcast(UUID ticketId, StreamEvent event) {
        Object lock = locks.computeIfAbsent(ticketId, ignored -> new Object());
        synchronized (lock) {
            subscribers.getOrDefault(ticketId, new CopyOnWriteArrayList<>()).forEach(emitter -> send(emitter, event));
        }
    }

    private void send(SseEmitter emitter, StreamEvent event) {
        try {
            emitter.send(SseEmitter.event()
                    .id(String.valueOf(event.getId()))
                    .name(event.getEventType())
                    .data(event.getPayload(), MediaType.APPLICATION_JSON));
        } catch (IOException | IllegalStateException exception) {
            emitter.complete();
        }
    }

    private void remove(UUID ticketId, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> ticketSubscribers = subscribers.get(ticketId);
        if (ticketSubscribers != null) {
            ticketSubscribers.remove(emitter);
            if (ticketSubscribers.isEmpty()) {
                subscribers.remove(ticketId, ticketSubscribers);
                locks.remove(ticketId);
            }
        }
    }

    private String toJson(Object payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "EVENT_SERIALIZATION_ERROR", "Не удалось сформировать событие");
        }
    }
}
