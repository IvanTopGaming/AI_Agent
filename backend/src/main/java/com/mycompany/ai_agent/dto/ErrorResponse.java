package com.mycompany.ai_agent.dto;

import java.util.Map;

public record ErrorResponse(ErrorBody error) {

    public record ErrorBody(
            String code,
            String message,
            Map<String, String> fields,
            String requestId
    ) {
    }
}
