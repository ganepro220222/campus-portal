package com.shuyuan.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("activity")
public class Activity {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String title;
    private String cover;
    private String coverFitMode;
    private String intro;
    private String location;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime enrollStartTime;
    private LocalDateTime enrollEndTime;
    private Integer quota;
    private Integer enrolledCount;
    private String status;
    private Integer needReview;
    private Long createdBy;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    @TableLogic
    private Integer isDeleted;
}
