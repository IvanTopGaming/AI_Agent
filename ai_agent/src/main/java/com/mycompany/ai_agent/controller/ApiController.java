package com.mycompany.ai_agent.controller;

import com.mycompany.ai_agent.service.AIService;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ApiController {

    final AIService aiservice;

    
    @PostMapping("/v1/tickets")
    
    
    @GetMapping("/ask")
    public Stream<?> ask(@RequestParam String prompt) {
        return aiservice.getAnswerStream(prompt).stream();
    }

}
