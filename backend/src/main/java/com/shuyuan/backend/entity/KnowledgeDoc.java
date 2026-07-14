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
    /** 手动录入的原始正文（供编辑回填；上传型可为空） */
    private String content;
    private Integer charCount;
    private Integer chunkCount;
    private String status;
    private Long uploadedBy;
    private LocalDateTime createdAt;
}
