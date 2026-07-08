package com.shuyuan.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("knowledge_chunk")
public class KnowledgeChunk {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long docId;
    private String chunkText;
    private Integer chunkIndex;
    private String embeddingJson;
    private String keywords;
    private Integer charCount;

    @TableField(exist = false)
    private double score;
}
