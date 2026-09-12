package com.mycompany.ai_agent.dto;

import javax.validation.constraints.Pattern;
import javax.validation.constraints.NotNull;

public class UpdateTicketRequest {

    @NotNull
    @Pattern(regexp = "resolved|escalated")
    private String status;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
