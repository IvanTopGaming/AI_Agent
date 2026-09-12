package com.mycompany.ai_agent.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class CreateTicketRequest {

    @NotBlank
    @Size(max = 100)
    private String title;

    @NotBlank
    private String description;

    @NotNull
    @Pattern(regexp = "technical|billing|bug|integration|general")
    private String category;

    @Pattern(regexp = "low|medium|high|urgent")
    private String priority;

    private List<UUID> attachmentIds = new ArrayList<>();
}
