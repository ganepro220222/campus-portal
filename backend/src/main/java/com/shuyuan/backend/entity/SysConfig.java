package com.shuyuan.backend.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("sys_config")
public class SysConfig {

    @TableId
    private String configKey;
    private String configValue;
    private String remark;
    private LocalDateTime updateTime;
}
