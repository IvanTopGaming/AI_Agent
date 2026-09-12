package com.mycompany.ai_agent.service;

import com.mycompany.ai_agent.entity.AiRun;
import com.mycompany.ai_agent.entity.Message;
import com.mycompany.ai_agent.entity.Ticket;
import com.mycompany.ai_agent.entity.TicketStatusHistory;
import com.mycompany.ai_agent.repository.AiRunRepository;
import com.mycompany.ai_agent.repository.MessageRepository;
import com.mycompany.ai_agent.repository.TicketRepository;
import com.mycompany.ai_agent.repository.TicketStatusHistoryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class AiGenerationService {

    private final AIService aiService;
    private final TicketRepository ticketRepository;
    private final MessageRepository messageRepository;
    private final AiRunRepository aiRunRepository;
    private final TicketStatusHistoryRepository statusHistoryRepository;
    private final TicketEventService eventService;
    private final TransactionTemplate transactionTemplate;

    public AiGenerationService(
            AIService aiService,
            TicketRepository ticketRepository,
            MessageRepository messageRepository,
            AiRunRepository aiRunRepository,
            TicketStatusHistoryRepository statusHistoryRepository,
            TicketEventService eventService,
            PlatformTransactionManager transactionManager
    ) {
        this.aiService = aiService;
        this.ticketRepository = ticketRepository;
        this.messageRepository = messageRepository;
        this.aiRunRepository = aiRunRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.eventService = eventService;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    @Async("aiExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void generate(AiRequestedEvent event) {
        Generation generation = transactionTemplate.execute(status -> initialize(event));
        if (generation == null) {
            return;
        }

        StringBuilder content = new StringBuilder();
        try {
            String input = buildInput(event.ticketId());
            aiService.streamAnswer(input, delta -> {
                if (delta == null || delta.isEmpty()) {
                    return;
                }
                content.append(delta);
                transactionTemplate.executeWithoutResult(status -> publishDelta(event.ticketId(), generation.messageId(), delta));
            });
            transactionTemplate.executeWithoutResult(status -> complete(event.ticketId(), generation, content.toString()));
        } catch (Exception | LinkageError exception) {
            log.error("AI generation failed for ticket {}", event.ticketId(), exception);
            transactionTemplate.executeWithoutResult(status -> fail(event.ticketId(), generation, exception));
        }
    }

    private Generation initialize(AiRequestedEvent event) {
        Ticket ticket = ticketRepository.findById(event.ticketId()).orElse(null);
        Message requestMessage = messageRepository.findById(event.requestMessageId()).orElse(null);
        if (ticket == null || requestMessage == null || "resolved".equals(ticket.getStatus())) {
            return null;
        }

        OffsetDateTime now = OffsetDateTime.now();
        Message responseMessage = new Message();
        responseMessage.setTicket(ticket);
        responseMessage.setRole("assistant");
        responseMessage.setStatus("streaming");
        responseMessage.setContent("");
        responseMessage.setFormat("markdown");
        responseMessage.setCreatedAt(now);
        responseMessage.setUpdatedAt(now);
        Message savedMessage = messageRepository.save(responseMessage);

        AiRun run = new AiRun();
        run.setTicket(ticket);
        run.setRequestMessage(requestMessage);
        run.setResponseMessage(savedMessage);
        run.setProvider(aiService.getProvider());
        run.setModel(aiService.getModel());
        run.setStatus("running");
        run.setStartedAt(now);
        run.setCreatedAt(now);
        AiRun savedRun = aiRunRepository.save(run);

        eventService.publish(ticket, "message.started", Map.of(
                "messageId", savedMessage.getId(),
                "role", "assistant",
                "createdAt", now
        ));
        return new Generation(savedMessage.getId(), savedRun.getId());
    }

    private String buildInput(UUID ticketId) {
        List<Message> messages = messageRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
        StringBuilder input = new StringBuilder();
        for (Message message : messages) {
            if (!message.getContent().isBlank()) {
                input.append(message.getRole()).append(": ").append(message.getContent()).append("\n\n");
            }
        }
        input.append("Ответь пользователю по-русски. Используй Markdown и учитывай всю историю диалога.");
        return input.toString();
    }

    private void publishDelta(UUID ticketId, UUID messageId, String delta) {
        Ticket ticket = ticketRepository.getById(ticketId);
        eventService.publish(ticket, "message.delta", Map.of("messageId", messageId, "delta", delta));
    }

    private void complete(UUID ticketId, Generation generation, String content) {
        Ticket ticket = ticketRepository.getById(ticketId);
        Message message = messageRepository.getById(generation.messageId());
        AiRun run = aiRunRepository.getById(generation.runId());
        OffsetDateTime now = OffsetDateTime.now();

        message.setContent(content);
        message.setStatus("completed");
        message.setUpdatedAt(now);
        message.setCompletedAt(now);
        run.setStatus("completed");
        run.setCompletedAt(now);

        eventService.publish(ticket, "message.completed", Map.of(
                "messageId", message.getId(),
                "content", content,
                "format", "markdown",
                "createdAt", message.getCreatedAt()
        ));
        if ("ai_processing".equals(ticket.getStatus())) {
            updateTicketStatus(ticket, "ai_answered", "ai.completed", now);
        }
    }

    private void fail(UUID ticketId, Generation generation, Throwable exception) {
        Ticket ticket = ticketRepository.findById(ticketId).orElse(null);
        Message message = messageRepository.findById(generation.messageId()).orElse(null);
        AiRun run = aiRunRepository.findById(generation.runId()).orElse(null);
        if (ticket == null || message == null || run == null) {
            return;
        }

        OffsetDateTime now = OffsetDateTime.now();
        message.setStatus("failed");
        message.setErrorCode("AI_PROVIDER_ERROR");
        message.setErrorMessage(exception.getMessage());
        message.setUpdatedAt(now);
        message.setCompletedAt(now);
        run.setStatus("failed");
        run.setErrorCode("AI_PROVIDER_ERROR");
        run.setErrorMessage(exception.getMessage());
        run.setCompletedAt(now);

        eventService.publish(ticket, "message.failed", Map.of(
                "messageId", message.getId(),
                "code", "AI_PROVIDER_ERROR",
                "message", "Не удалось сформировать ответ"
        ));
        if ("ai_processing".equals(ticket.getStatus())) {
            updateTicketStatus(ticket, "open", "ai.failed", now);
        }
    }

    private void updateTicketStatus(Ticket ticket, String nextStatus, String reason, OffsetDateTime now) {
        String previousStatus = ticket.getStatus();
        ticket.setStatus(nextStatus);
        ticket.setUpdatedAt(now);

        TicketStatusHistory history = new TicketStatusHistory();
        history.setTicket(ticket);
        history.setPreviousStatus(previousStatus);
        history.setNextStatus(nextStatus);
        history.setReason(reason);
        history.setCreatedAt(now);
        statusHistoryRepository.save(history);

        eventService.publish(ticket, "ticket.updated", new TicketService.TicketUpdatedEvent(ticket.getId(), nextStatus, now));
    }

    private record Generation(UUID messageId, UUID runId) {
    }
}
