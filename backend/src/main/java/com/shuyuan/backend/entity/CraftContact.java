package com.shuyuan.backend.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("craft_contact")
public class CraftContact {

    @TableId
    private Long craftId;
    private String phone;
    private String wechat;
    private String workWechat;
    private String email;
    private LocalDateTime updateTime;
}
