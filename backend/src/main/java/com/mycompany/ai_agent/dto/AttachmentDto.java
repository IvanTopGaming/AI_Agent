package com.mycompany.ai_agent.dto;

import java.util.UUID;

public record AttachmentDto(
        UUID id,
        String name,
        String contentType,
        long sizeBytes,
        String downloadUrl
) {
}
