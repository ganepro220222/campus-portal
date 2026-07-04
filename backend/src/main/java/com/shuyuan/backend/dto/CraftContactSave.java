package com.shuyuan.backend.dto;

import lombok.Data;

/** 文创咨询联系方式 */
@Data
public class CraftContactSave {

    private String phone;
    private String wechat;
    private String workWechat;
    private String email;
}
