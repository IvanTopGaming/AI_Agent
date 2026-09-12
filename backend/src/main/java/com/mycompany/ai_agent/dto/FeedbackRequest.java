package com.mycompany.ai_agent.dto;

import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;
import javax.validation.constraints.NotNull;

public class FeedbackRequest {

    @NotNull
    @Pattern(regexp = "positive|negative")
    private String rating;

    @Size(max = 1000)
    private String comment;

    public String getRating() {
        return rating;
    }

    public void setRating(String rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}
