package com.shuyuan.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("craft")
public class Craft {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String cover;
    private String coverFitMode;
    private Long categoryId;
    private String introZh;
    private String introEn;
    @TableField("model_3d_url")
    private String model3dUrl;
    private String posterUrl;
    private String transformJson;
    private String materialJson;
    private String cameraJson;
    private Integer viewerEnabled;
    private String previewType;
    private Integer status;
    private Integer sort;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    @TableLogic
    private Integer isDeleted;
}
