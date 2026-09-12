package com.mycompany.ai_agent.service;

import com.mycompany.ai_agent.dto.AttachmentDto;
import com.mycompany.ai_agent.dto.CreateMessageRequest;
import com.mycompany.ai_agent.dto.CreateMessageResponse;
import com.mycompany.ai_agent.dto.CreateTicketRequest;
import com.mycompany.ai_agent.dto.FeedbackRequest;
import com.mycompany.ai_agent.dto.MessageDto;
import com.mycompany.ai_agent.dto.MessageListResponse;
import com.mycompany.ai_agent.dto.TicketDto;
import com.mycompany.ai_agent.dto.TicketResponse;
import com.mycompany.ai_agent.dto.UpdateTicketRequest;
import com.mycompany.ai_agent.entity.Attachment;
import com.mycompany.ai_agent.entity.Message;
import com.mycompany.ai_agent.entity.MessageFeedback;
import com.mycompany.ai_agent.entity.Ticket;
import com.mycompany.ai_agent.entity.TicketStatusHistory;
import com.mycompany.ai_agent.exception.ApiException;
import com.mycompany.ai_agent.repository.MessageFeedbackRepository;
import com.mycompany.ai_agent.repository.MessageRepository;
import com.mycompany.ai_agent.repository.TicketRepository;
import com.mycompany.ai_agent.repository.TicketStatusHistoryRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final MessageRepository messageRepository;
    private final TicketStatusHistoryRepository statusHistoryRepository;
    private final MessageFeedbackRepository feedbackRepository;
    private final AttachmentService attachmentService;
    private final TicketEventService eventService;
    private final ApplicationEventPublisher applicationEventPublisher;

    public TicketService(
            TicketRepository ticketRepository,
            MessageRepository messageRepository,
            TicketStatusHistoryRepository statusHistoryRepository,
            MessageFeedbackRepository feedbackRepository,
            AttachmentService attachmentService,
            TicketEventService eventService,
            ApplicationEventPublisher applicationEventPublisher
    ) {
        this.ticketRepository = ticketRepository;
        this.messageRepository = messageRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.feedbackRepository = feedbackRepository;
        this.attachmentService = attachmentService;
        this.eventService = eventService;
        this.applicationEventPublisher = applicationEventPublisher;
    }

    @Transactional
    public TicketResponse create(CreateTicketRequest request) {
        OffsetDateTime now = OffsetDateTime.now();
        List<Attachment> attachments = attachmentService.getAll(request.getAttachmentIds());

        Ticket ticket = new Ticket();
        ticket.setTitle(request.getTitle().trim());
        ticket.setDescription(request.getDescription().trim());
        ticket.setCategory(request.getCategory());
        ticket.setPriority(request.getPriority() == null ? "medium" : request.getPriority());
        ticket.setStatus("ai_processing");
        ticket.setCreatedAt(now);
        ticket.setUpdatedAt(now);
        ticket.getAttachments().addAll(attachments);
        Ticket savedTicket = ticketRepository.saveAndFlush(ticket);

        Message message = new Message();
        message.setTicket(savedTicket);
        message.setRole("user");
        message.setStatus("completed");
        message.setContent(savedTicket.getDescription());
        message.setFormat("markdown");
        message.setCreatedAt(now);
        message.setUpdatedAt(now);
        message.setCompletedAt(now);
        Message savedMessage = messageRepository.save(message);

        saveStatusChange(savedTicket, null, "ai_processing", "ticket.created", now);
        applicationEventPublisher.publishEvent(new AiRequestedEvent(savedTicket.getId(), savedMessage.getId()));
        return toTicketResponse(savedTicket);
    }

    @Transactional(readOnly = true)
    public TicketResponse get(UUID ticketId) {
        return toTicketResponse(requireTicket(ticketId));
    }

    @Transactional(readOnly = true)
    public MessageListResponse getMessages(UUID ticketId, UUID cursor, int requestedLimit) {
        requireTicket(ticketId);
        int limit = Math.max(1, Math.min(requestedLimit, 100));
        PageRequest page = PageRequest.of(0, limit + 1);
        List<Message> messages;
        if (cursor == null) {
            messages = messageRepository.findByTicketIdOrderByCreatedAtAscIdAsc(ticketId, page);
        } else {
            Message cursorMessage = messageRepository.findByIdAndTicketId(cursor, ticketId)
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CURSOR", "Курсор сообщений некорректен"));
            messages = messageRepository.findPageAfter(ticketId, cursorMessage.getCreatedAt(), cursorMessage.getId(), page);
        }

        UUID nextCursor = messages.size() > limit ? messages.get(limit - 1).getId() : null;
        List<MessageDto> items = messages.stream().limit(limit).map(this::toMessageDto).toList();
        return new MessageListResponse(items, nextCursor);
    }

    @Transactional
    public CreateMessageResponse createMessage(UUID ticketId, CreateMessageRequest request) {
        Ticket ticket = requireTicket(ticketId);
        if ("resolved".equals(ticket.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "TICKET_RESOLVED", "Нельзя отправить сообщение в закрытое обращение");
        }

        OffsetDateTime now = OffsetDateTime.now();
        List<Attachment> attachments = attachmentService.getAll(request.getAttachmentIds());
        Message message = new Message();
        message.setTicket(ticket);
        message.setRole("user");
        message.setStatus("completed");
        message.setContent(request.getContent().trim());
        message.setFormat("markdown");
        message.setCreatedAt(now);
        message.setUpdatedAt(now);
        message.setCompletedAt(now);
        message.getAttachments().addAll(attachments);
        Message saved = messageRepository.save(message);

        changeStatus(ticket, "ai_processing", "message.created", now);
        applicationEventPublisher.publishEvent(new AiRequestedEvent(ticketId, saved.getId()));
        return new CreateMessageResponse(toMessageDto(saved), "ai_processing");
    }

    @Transactional
    public TicketResponse update(UUID ticketId, UpdateTicketRequest request) {
        Ticket ticket = requireTicket(ticketId);
        OffsetDateTime now = OffsetDateTime.now();
        changeStatus(ticket, request.getStatus(), "user.request", now);
        if ("resolved".equals(request.getStatus())) {
            ticket.setResolvedAt(now);
        }
        TicketResponse response = toTicketResponse(ticketRepository.save(ticket));
        eventService.publish(ticket, "ticket.updated", new TicketUpdatedEvent(ticket.getId(), ticket.getStatus(), ticket.getUpdatedAt()));
        return response;
    }

    @Transactional
    public void saveFeedback(UUID messageId, FeedbackRequest request) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "MESSAGE_NOT_FOUND", "Сообщение не найдено"));
        if (!"assistant".equals(message.getRole())) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_FEEDBACK_TARGET", "Оценить можно только ответ AI");
        }

        OffsetDateTime now = OffsetDateTime.now();
        MessageFeedback feedback = feedbackRepository.findByMessageId(messageId).orElseGet(MessageFeedback::new);
        if (feedback.getId() == null) {
            feedback.setMessage(message);
            feedback.setCreatedAt(now);
        }
        feedback.setRating("positive".equals(request.getRating()) ? (short) 1 : (short) -1);
        feedback.setComment(request.getComment());
        feedback.setUpdatedAt(now);
        feedbackRepository.save(feedback);
    }

    Ticket requireTicket(UUID ticketId) {
        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "TICKET_NOT_FOUND", "Обращение не найдено"));
    }

    TicketResponse toTicketResponse(Ticket ticket) {
        List<AttachmentDto> attachments = ticket.getAttachments().stream().map(attachmentService::toDto).toList();
        TicketDto dto = new TicketDto(
                ticket.getId(),
                "TK-" + ticket.getTicketNumber(),
                ticket.getTitle(),
                ticket.getDescription(),
                ticket.getCategory(),
                ticket.getPriority(),
                ticket.getStatus(),
                ticket.getCreatedAt(),
                ticket.getUpdatedAt(),
                attachments
        );
        return new TicketResponse(dto);
    }

    MessageDto toMessageDto(Message message) {
        List<AttachmentDto> attachments = message.getAttachments().stream().map(attachmentService::toDto).toList();
        return new MessageDto(
                message.getId(),
                message.getTicket().getId(),
                message.getRole(),
                message.getContent(),
                message.getFormat(),
                message.getCreatedAt(),
                attachments
        );
    }

    private void changeStatus(Ticket ticket, String nextStatus, String reason, OffsetDateTime now) {
        String previousStatus = ticket.getStatus();
        if (nextStatus.equals(previousStatus)) {
            return;
        }
        ticket.setStatus(nextStatus);
        ticket.setUpdatedAt(now);
        if (!"resolved".equals(nextStatus)) {
            ticket.setResolvedAt(null);
        }
        saveStatusChange(ticket, previousStatus, nextStatus, reason, now);
    }

    private void saveStatusChange(Ticket ticket, String previousStatus, String nextStatus, String reason, OffsetDateTime now) {
        TicketStatusHistory history = new TicketStatusHistory();
        history.setTicket(ticket);
        history.setPreviousStatus(previousStatus);
        history.setNextStatus(nextStatus);
        history.setReason(reason);
        history.setCreatedAt(now);
        statusHistoryRepository.save(history);
    }

    public record TicketUpdatedEvent(UUID ticketId, String status, OffsetDateTime updatedAt) {
    }
}
