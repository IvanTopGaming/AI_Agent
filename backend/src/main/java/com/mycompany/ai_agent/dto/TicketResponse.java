package com.mycompany.ai_agent.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class TicketResponse {

    private UUID id;
    private Long ticketNumber;
    private String title;
    private String description;
    private String category;
    private String priority;
    private String status;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}