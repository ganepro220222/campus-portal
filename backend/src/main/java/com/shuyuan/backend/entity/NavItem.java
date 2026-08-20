package com.shuyuan.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("nav_item")
public class NavItem {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String label;
    /** 小程序 icon 组件名（如 entry-news、museum） */
    private String icon;
    /** 小程序页面路径，如 /pages/news/index */
    private String path;
    private Integer sort;
    private Integer status;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    @TableLogic
    private Integer isDeleted;
}
