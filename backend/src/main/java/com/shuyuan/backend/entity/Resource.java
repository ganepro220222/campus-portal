package com.shuyuan.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("resource")
public class Resource {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String fileUrl;
    private String previewUrl;
    private String fileType;
    private Integer fileSizeKb;
    private Long categoryId;
    private Integer downloadCount;
    private Integer status;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    @TableLogic
    private Integer isDeleted;
}
