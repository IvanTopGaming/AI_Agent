package com.mycompany.ai_agent.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateTicketRequest {

    private String title;
    private String description;
    private String category;
    private String priority;
}