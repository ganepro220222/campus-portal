package com.shuyuan.backend.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class EnrollRejectRequest {

    /** 拒绝原因 */
    @Size(max = 200, message = "拒绝原因不超过 200 字")
    private String reason;
}
