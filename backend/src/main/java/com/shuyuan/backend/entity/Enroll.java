package com.shuyuan.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("enroll")
public class Enroll {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long activityId;
    private Long memberId;
    private String name;
    private String phone;
    private String college;
    private String grade;
    private String status;
    private String voucherCode;
    private String qrCodeUrl;
    private String rejectReason;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    @TableLogic
    private Integer isDeleted;
}
