package com.mycompany.ai_agent.exception;

import com.mycompany.ai_agent.dto.ErrorResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import javax.servlet.http.HttpServletRequest;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApi(ApiException exception, HttpServletRequest request) {
        return response(exception.getStatus(), exception.getCode(), exception.getMessage(), Map.of(), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException exception, HttpServletRequest request) {
        Map<String, String> fields = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors().forEach(error -> fields.putIfAbsent(error.getField(), error.getDefaultMessage()));
        return response(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Некорректные параметры запроса", fields, request);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleUploadSize(MaxUploadSizeExceededException exception, HttpServletRequest request) {
        return response(HttpStatus.PAYLOAD_TOO_LARGE, "FILE_TOO_LARGE", "Превышен допустимый размер файла", Map.of(), request);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleConflict(DataIntegrityViolationException exception, HttpServletRequest request) {
        return response(HttpStatus.CONFLICT, "CONFLICT", "Данные конфликтуют с текущим состоянием", Map.of(), request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception exception, HttpServletRequest request) {
        log.error("Unhandled API error", exception);
        return response(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Внутренняя ошибка сервера", Map.of(), request);
    }

    private ResponseEntity<ErrorResponse> response(
            HttpStatus status,
            String code,
            String message,
            Map<String, String> fields,
            HttpServletRequest request
    ) {
        String requestId = String.valueOf(request.getAttribute(RequestIdFilter.REQUEST_ID_ATTRIBUTE));
        ErrorResponse body = new ErrorResponse(new ErrorResponse.ErrorBody(code, message, fields, requestId));
        return ResponseEntity.status(status).body(body);
    }
}
