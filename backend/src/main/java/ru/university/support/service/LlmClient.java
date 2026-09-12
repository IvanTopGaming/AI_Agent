package ru.university.support.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import ru.university.support.config.LlmProperties;
import ru.university.support.dto.LlmAnalysisResult;
import ru.university.support.exception.LlmIntegrationException;

@Component
public class LlmClient {

    private static final String SYSTEM_PROMPT = """
            Ты анализируешь обращения в техническую поддержку вуза.
            Верни только JSON без markdown в формате:
            {
              "category": "WIFI | ACCOUNT | EDUCATION_PLATFORM | OTHER",
              "problemDescription": "краткое нормализованное описание",
              "priority": "LOW | MEDIUM | HIGH | CRITICAL",
              "missingFields": ["названия недостающих данных"],
              "clarificationQuestion": "один короткий вопрос или null"
            }
            Для Wi-Fi проверь наличие корпуса/места, имени сети и типа устройства.
            Для учетной записи проверь наличие сервиса, логина и текста ошибки, но не запрашивай пароль.
            Для образовательной платформы проверь название платформы, курс/дисциплину и текст ошибки.
            Если данных достаточно, missingFields должен быть пустым, а clarificationQuestion равен null.
            Если проблем несколько, выбери основную, а остальные упомяни в problemDescription.
            """;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final LlmProperties properties;

    public LlmClient(RestClient restClient, ObjectMapper objectMapper, LlmProperties properties) {
        this.restClient = restClient;
        this.objectMapper = objectMapper;
        this.properties = properties;
    }

    public LlmAnalysisResult analyze(String text) {
        validateConfiguration();

        Map<String, Object> body = Map.of(
                "model", properties.getModel(),
                "temperature", 0.1,
                "messages", List.of(
                        Map.of("role", "system", "content", SYSTEM_PROMPT),
                        Map.of("role", "user", "content", text)
                )
        );

        try {
            JsonNode response = restClient.post()
                    .uri(properties.getApiUrl())
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.getApiKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);

            if (response == null) {
                throw new LlmIntegrationException("LLM вернула пустой ответ");
            }

            if (response.has("category")) {
                return objectMapper.treeToValue(response, LlmAnalysisResult.class);
            }

            String content = response.path("choices").path(0).path("message").path("content").asText();
            if (!StringUtils.hasText(content)) {
                content = response.path("output_text").asText();
            }
            if (!StringUtils.hasText(content)) {
                throw new LlmIntegrationException("Не удалось найти результат анализа в ответе LLM");
            }

            return objectMapper.readValue(stripMarkdown(content), LlmAnalysisResult.class);
        } catch (LlmIntegrationException exception) {
            throw exception;
        } catch (JsonProcessingException exception) {
            throw new LlmIntegrationException("LLM вернула некорректный JSON", exception);
        } catch (Exception exception) {
            throw new LlmIntegrationException("Ошибка при обращении к LLM API", exception);
        }
    }

    private void validateConfiguration() {
        if (!StringUtils.hasText(properties.getApiUrl())
                || !StringUtils.hasText(properties.getApiKey())
                || !StringUtils.hasText(properties.getModel())) {
            throw new LlmIntegrationException("Не настроены LLM_API_URL, LLM_API_KEY или LLM_MODEL");
        }
    }

    private String stripMarkdown(String content) {
        String value = content.trim();
        if (value.startsWith("```")) {
            value = value.replaceFirst("^```(?:json)?\\s*", "");
            value = value.replaceFirst("\\s*```$", "");
        }
        return value;
    }
}
