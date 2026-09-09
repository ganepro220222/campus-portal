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
    /** 进度对应的教学视频版本 */
    private Long videoRevision;
    /** 上次真实播放位置，用于下次续播（允许后退复习后回退） */
    private Integer lastPositionSeconds;
    private Integer totalDurationSeconds;
    /** 历史最高学习百分比，只增不减 */
    private BigDecimal progressPercent;
    private Integer completed;
    /** 累计有效观看秒数（完成判定依据，非 updated_at 间隔） */
    private Integer watchedSeconds;
    /** 上次上报时的播放位置，用于累计观看增量 */
    private Integer lastReportPositionSeconds;
    private LocalDateTime updatedAt;
}
