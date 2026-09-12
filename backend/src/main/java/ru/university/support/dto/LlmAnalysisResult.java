package ru.university.support.dto;

import java.util.List;
import ru.university.support.entity.TicketCategory;
import ru.university.support.entity.TicketPriority;

public record LlmAnalysisResult(
        TicketCategory category,
        String problemDescription,
        TicketPriority priority,
        List<String> missingFields,
        String clarificationQuestion
) {
}
