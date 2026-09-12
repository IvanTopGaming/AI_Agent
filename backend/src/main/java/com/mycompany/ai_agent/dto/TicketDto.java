package com.mycompany.ai_agent.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record TicketDto(
        UUID id,
        String number,
        String title,
        String description,
        String category,
        String priority,
        String status,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        List<AttachmentDto> attachments
) {
}
