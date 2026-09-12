package ru.university.support.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import ru.university.support.dto.LlmAnalysisResult;
import ru.university.support.dto.SupportRequest;
import ru.university.support.dto.SupportResponse;
import ru.university.support.entity.Ticket;
import ru.university.support.exception.LlmIntegrationException;
import ru.university.support.repository.TicketRepository;

@Service
public class SupportService {

    private final LlmClient llmClient;
    private final TicketRepository ticketRepository;

    public SupportService(LlmClient llmClient, TicketRepository ticketRepository) {
        this.llmClient = llmClient;
        this.ticketRepository = ticketRepository;
    }

    @Transactional
    public SupportResponse process(SupportRequest request) {
        LlmAnalysisResult analysis = llmClient.analyze(request.text());
        List<String> missingFields = analysis.missingFields() == null ? List.of() : analysis.missingFields();

        if (!missingFields.isEmpty()) {
            String question = StringUtils.hasText(analysis.clarificationQuestion())
                    ? analysis.clarificationQuestion()
                    : "Пожалуйста, уточните: " + String.join(", ", missingFields);
            return SupportResponse.clarificationRequired(analysis, question);
        }

        if (analysis.category() == null
                || analysis.priority() == null
                || !StringUtils.hasText(analysis.problemDescription())) {
            throw new LlmIntegrationException("LLM вернула неполный результат анализа");
        }

        Ticket ticket = new Ticket(
                request.text(),
                request.source(),
                analysis.category(),
                analysis.problemDescription(),
                analysis.priority()
        );
        Ticket savedTicket = ticketRepository.save(ticket);

        return SupportResponse.ticketCreated(analysis, savedTicket.getId());
    }
}
