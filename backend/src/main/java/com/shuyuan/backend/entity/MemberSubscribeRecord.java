package com.shuyuan.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("member_subscribe_record")
public class MemberSubscribeRecord {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long memberId;
    private String templateId;
    private String scene;
    private Integer availableCount;
    private LocalDateTime authorizedAt;
    private LocalDateTime lastUsedAt;
}
