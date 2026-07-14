package com.shuyuan.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("subscribe_outbox")
public class SubscribeOutbox {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long memberId;
    private String scene;
    private String payloadJson;
    private String status;
    private Integer attemptCount;
    private String lastError;
    private LocalDateTime nextRetryAt;
    private LocalDateTime lockedAt;
    private LocalDateTime sentAt;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
