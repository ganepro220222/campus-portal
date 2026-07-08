package com.shuyuan.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("knowledge_doc")
public class KnowledgeDoc {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String title;
    private String fileUrl;
    private String sourceType;
    private Integer charCount;
    private Integer chunkCount;
    private String status;
    private Long uploadedBy;
    private LocalDateTime createdAt;
}
