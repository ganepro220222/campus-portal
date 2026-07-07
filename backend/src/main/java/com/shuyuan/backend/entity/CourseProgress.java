package com.shuyuan.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("course_progress")
public class CourseProgress {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long memberId;
    private Long courseId;
    private Integer lastPositionSeconds;
    private Integer totalDurationSeconds;
    private BigDecimal progressPercent;
    private Integer completed;
    private LocalDateTime updatedAt;
}
