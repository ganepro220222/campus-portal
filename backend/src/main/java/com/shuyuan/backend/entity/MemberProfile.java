package com.shuyuan.backend.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("member_profile")
public class MemberProfile {

    @TableId
    private Long memberId;
    private String realName;
    private String college;
    private String grade;
    private String phone;
    private LocalDateTime updateTime;
}
