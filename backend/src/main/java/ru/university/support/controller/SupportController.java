package ru.university.support.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import ru.university.support.dto.SupportRequest;
import ru.university.support.dto.SupportResponse;
import ru.university.support.service.SupportService;

@RestController
@RequestMapping("/api/support")
public class SupportController {

    private final SupportService supportService;

    public SupportController(SupportService supportService) {
        this.supportService = supportService;
    }

    @PostMapping("/analyze")
    @ResponseStatus(HttpStatus.OK)
    public SupportResponse analyze(@Valid @RequestBody SupportRequest request) {
        return supportService.process(request);
    }
}
