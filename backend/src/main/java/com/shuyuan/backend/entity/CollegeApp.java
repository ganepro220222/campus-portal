package com.shuyuan.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("college_app")
public class CollegeApp {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String appid;
    private String path;
    private String iconUrl;
    private String description;
    private Integer sort;
    /** 1 上架 0 下架 */
    private Integer status;
    /** manual / jump / embed_h5 / api_sync */
    private String contentType;
    private String contentUrl;
    private String apiToken;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    @TableLogic
    private Integer isDeleted;
}
