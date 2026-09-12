package com.mycompany.ai_agent.service;

import com.mycompany.ai_agent.exception.ApiException;
import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import com.openai.core.http.StreamResponse;
import com.openai.models.responses.ResponseCreateParams;
import com.openai.models.responses.ResponsePrompt;
import com.openai.models.responses.ResponseStreamEvent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.function.Consumer;

@Service
public class AIService {

    private final String apiKey;
    private final String baseUrl;
    private final String organization;
    private final String promptId;
    private final String model;

    public AIService(
            @Value("${llm.api-key}") String apiKey,
            @Value("${llm.base-url}") String baseUrl,
            @Value("${llm.organization}") String organization,
            @Value("${llm.prompt-id}") String promptId,
            @Value("${llm.model}") String model
    ) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.organization = organization;
        this.promptId = promptId;
        this.model = model;
    }

    public void streamAnswer(String input, Consumer<String> onDelta) {
        if (apiKey.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AI_NOT_CONFIGURED", "Ключ AI-провайдера не настроен");
        }

        OpenAIClient client = OpenAIOkHttpClient.builder()
                .apiKey(apiKey)
                .baseUrl(baseUrl)
                .organization(organization)
                .build();

        ResponseCreateParams params = ResponseCreateParams.builder()
                .prompt(ResponsePrompt.builder().id(promptId).build())
                .input(input)
                .build();

        try (StreamResponse<ResponseStreamEvent> response = client.responses().createStreaming(params)) {
            response.stream().forEach(event -> event.outputTextDelta()
                    .ifPresent(delta -> onDelta.accept(delta.delta())));
        }
    }

    public String getProvider() {
        return "yandex-cloud";
    }

    public String getModel() {
        return model;
    }
}
