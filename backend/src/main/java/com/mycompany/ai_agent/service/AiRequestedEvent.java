package com.mycompany.ai_agent.service;

import java.util.UUID;

public record AiRequestedEvent(UUID ticketId, UUID requestMessageId) {
}
