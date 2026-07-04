package com.shuyuan.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("craft_image")
public class CraftImage {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long craftId;
    private String imageUrl;
    private String angleLabel;
    private Integer sort;
    private LocalDateTime createTime;
    @TableLogic
    private Integer isDeleted;
}
