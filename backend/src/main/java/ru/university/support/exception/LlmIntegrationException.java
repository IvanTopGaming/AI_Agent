package ru.university.support.exception;

public class LlmIntegrationException extends RuntimeException {

    public LlmIntegrationException(String message) {
        super(message);
    }

    public LlmIntegrationException(String message, Throwable cause) {
        super(message, cause);
    }
}
