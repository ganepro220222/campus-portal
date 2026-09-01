package com.shuyuan.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 上传对象元信息。OSS 对象名是 32 位 hex，后台刷新后还原不出老师传的是哪个文件，
 * 这里按对象名记一份原始文件名 / 大小 / 上传时间供预览框展示。
 *
 * 没有 is_deleted：这张表是对象的附属信息，对象删了就一起物理删，不需要软删。
 */
@Data
@TableName("oss_object_meta")
public class OssObjectMeta {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String objectKey;
    private String originalName;
    private Long sizeBytes;
    private String scene;
    private LocalDateTime createTime;
}
