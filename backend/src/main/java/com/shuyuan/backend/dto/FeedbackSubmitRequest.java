package com.shuyuan.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class FeedbackSubmitRequest {

    private String type;
    private String content;
    private String contact;
    private List<String> images;
}
