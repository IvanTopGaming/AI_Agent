package com.mycompany.ai_agent.dto;

import javax.validation.constraints.NotBlank;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class CreateMessageRequest {

    @NotBlank
    private String content;

    private List<UUID> attachmentIds = new ArrayList<>();

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public List<UUID> getAttachmentIds() {
        return attachmentIds;
    }

    public void setAttachmentIds(List<UUID> attachmentIds) {
        this.attachmentIds = attachmentIds;
    }
}
