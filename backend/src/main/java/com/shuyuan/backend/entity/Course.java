package com.shuyuan.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("course")
public class Course {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String cover;
    private Long categoryId;
    private String targetAudience;
    private Integer durationMinutes;
    private LocalDateTime startTime;
    private String intro;
    private String videoUrl;
    private String subtitleUrl;
    private String subtitleStatus;
    private String subtitleTaskId;
    private Integer status;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    @TableLogic
    private Integer isDeleted;
}
