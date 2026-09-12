package ru.university.support.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import ru.university.support.entity.TicketSource;

public record SupportRequest(
        @NotBlank(message = "Текст обращения не должен быть пустым") String text,
        @NotNull(message = "Укажите источник обращения") TicketSource source
) {
}
