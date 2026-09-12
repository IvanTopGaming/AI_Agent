package ru.university.support.dto;

public record SupportResponse(
        String action,
        LlmAnalysisResult analysis,
        Long ticketId,
        String clarificationQuestion
) {

    public static SupportResponse ticketCreated(LlmAnalysisResult analysis, Long ticketId) {
        return new SupportResponse("TICKET_CREATED", analysis, ticketId, null);
    }

    public static SupportResponse clarificationRequired(LlmAnalysisResult analysis, String question) {
        return new SupportResponse("CLARIFICATION_REQUIRED", analysis, null, question);
    }
}
