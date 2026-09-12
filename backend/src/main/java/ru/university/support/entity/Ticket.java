package ru.university.support.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "tickets")
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "original_text", nullable = false, columnDefinition = "TEXT")
    private String originalText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private TicketSource source;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 64)
    private TicketCategory category;

    @Column(name = "problem_description", nullable = false, columnDefinition = "TEXT")
    private String problemDescription;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private TicketPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private TicketStatus status = TicketStatus.NEW;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    protected Ticket() {
    }

    public Ticket(
            String originalText,
            TicketSource source,
            TicketCategory category,
            String problemDescription,
            TicketPriority priority
    ) {
        this.originalText = originalText;
        this.source = source;
        this.category = category;
        this.problemDescription = problemDescription;
        this.priority = priority;
    }

    public Long getId() {
        return id;
    }

    public String getOriginalText() {
        return originalText;
    }

    public TicketSource getSource() {
        return source;
    }

    public TicketCategory getCategory() {
        return category;
    }

    public String getProblemDescription() {
        return problemDescription;
    }

    public TicketPriority getPriority() {
        return priority;
    }

    public TicketStatus getStatus() {
        return status;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
