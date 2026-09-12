package com.mycompany.ai_agent.dto;

import java.util.List;
import java.util.UUID;

public record MessageListResponse(List<MessageDto> items, UUID nextCursor) {
}
