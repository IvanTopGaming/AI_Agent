package com.mycompany.ai_agent.service;

import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import com.openai.core.http.StreamResponse;
import com.openai.models.responses.ResponseCreateParams;
import com.openai.models.responses.ResponsePrompt;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

@Slf4j
@Service
public class AIService {

    @Value("${openai.api-key}")
    private String apiKey;

    public StreamResponse getAnswerStream(String promt) {
        OpenAIClient client = OpenAIOkHttpClient.builder()
                .apiKey(apiKey)
                .baseUrl("https://ai.api.cloud.yandex.net/v1")
                .organization("b1ghmng15krs44a6li2q")
                .build();

        ResponseCreateParams params = ResponseCreateParams.builder()
                .prompt(ResponsePrompt.builder()
                        .id("fvtcdisgqkmtebld6vdh")
                        .build())
                .input(promt)
                .build();

        StreamResponse response = client.responses().createStreaming(params);

        return response;
    }

}
