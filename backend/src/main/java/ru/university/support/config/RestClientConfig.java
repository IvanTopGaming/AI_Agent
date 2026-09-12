package ru.university.support.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(LlmProperties.class)
public class RestClientConfig {

    @Bean
    RestClient restClient(RestClient.Builder builder) {
        return builder.build();
    }
}
