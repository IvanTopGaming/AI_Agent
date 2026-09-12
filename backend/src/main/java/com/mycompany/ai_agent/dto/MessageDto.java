package com.mycompany.ai_agent.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record MessageDto(
        UUID id,
        UUID ticketId,
        String role,
        String content,
        String format,
        OffsetDateTime createdAt,
        List<AttachmentDto> attachments
) {
}
