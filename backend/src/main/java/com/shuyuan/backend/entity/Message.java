package com.shuyuan.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("message")
public class Message {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long memberId;
    private String title;
    private String content;
    private String type;
    private String relatedType;
    private Long relatedId;
    private Integer readStatus;
    private LocalDateTime createdAt;
}
