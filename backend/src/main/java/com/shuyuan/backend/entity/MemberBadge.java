package com.shuyuan.backend.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("member_badge")
public class MemberBadge {

    private Long memberId;
    private Long badgeId;
    private LocalDateTime achievedAt;
}
