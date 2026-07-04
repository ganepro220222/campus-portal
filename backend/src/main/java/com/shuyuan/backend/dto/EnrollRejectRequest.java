package com.shuyuan.backend.dto;

import lombok.Data;

@Data
public class EnrollRejectRequest {

    /** 拒绝原因 */
    private String reason;
}
