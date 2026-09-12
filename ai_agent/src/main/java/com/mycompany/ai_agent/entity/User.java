package com.mycompany.ai_agent.entity;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.*;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.OneToMany;
import javax.persistence.Table;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "external_id", unique = true)
    private String externalId;

    @Column(unique = true)
    private String email;

    @Column(name = "display_name")
    private String displayName;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "requester")
    private List<Ticket> requestedTickets = new ArrayList<>();

    @OneToMany(mappedBy = "assignedOperator")
    private List<Ticket> assignedTickets = new ArrayList<>();

    @OneToMany(mappedBy = "author")
    private List<Message> messages = new ArrayList<>();

    @OneToMany(mappedBy = "owner")
    private List<Attachment> attachments = new ArrayList<>();

    @OneToMany(mappedBy = "user")
    private List<MessageFeedback> feedback = new ArrayList<>();

    @OneToMany(mappedBy = "changedBy")
    private List<TicketStatusHistory> statusChanges = new ArrayList<>();
}