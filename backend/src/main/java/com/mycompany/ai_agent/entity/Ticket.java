package com.mycompany.ai_agent.entity;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.*;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.JoinTable;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.Table;
import org.hibernate.annotations.Generated;
import org.hibernate.annotations.GenerationTime;

@Entity
@Table(name = "tickets")
@Getter
@Setter
@NoArgsConstructor
public class Ticket {

    @Id
    @GeneratedValue
    private UUID id;

    @Generated(GenerationTime.INSERT)
    @Column(name = "ticket_number", nullable = false, unique = true, insertable = false, updatable = false)
    private Long ticketNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id")
    private User requester;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false, length = 20)
    private String category;

    @Column(nullable = false, length = 20)
    private String priority;

    @Column(nullable = false, length = 20)
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_operator_id")
    private User assignedOperator;

    @Column(name = "resolved_at")
    private OffsetDateTime resolvedAt;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(
            mappedBy = "ticket",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<Message> messages = new ArrayList<>();

    @OneToMany(
            mappedBy = "ticket",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<TicketStatusHistory> statusHistory = new ArrayList<>();

    @OneToMany(mappedBy = "ticket")
    private List<AiRun> aiRuns = new ArrayList<>();

    @OneToMany(mappedBy = "ticket")
    private List<StreamEvent> streamEvents = new ArrayList<>();

    @OneToMany
    @JoinTable(
            name = "ticket_attachments",
            joinColumns = @JoinColumn(name = "ticket_id"),
            inverseJoinColumns = @JoinColumn(name = "attachment_id")
    )
    private List<Attachment> attachments = new ArrayList<>();
}
