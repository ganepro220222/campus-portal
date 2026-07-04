package com.shuyuan.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("download_record")
public class DownloadRecord {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long memberId;
    private Long resourceId;
    private String fileName;
    private LocalDateTime downloadedAt;
}
