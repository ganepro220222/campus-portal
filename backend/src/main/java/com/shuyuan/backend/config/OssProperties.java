package com.shuyuan.backend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 阿里云 OSS / CDN 配置（技术方案 §6.2、验收 §六 OSS 签名访问）
 */
@Data
@Component
@ConfigurationProperties(prefix = "shuyuan.oss")
public class OssProperties {

    /** 是否启用 OSS（未配置密钥时自动视为关闭，开发环境可手填 URL） */
    private boolean enabled = false;
    private String endpoint = "";
    private String bucket = "";
    private String accessKey = "";
    private String secretKey = "";
    /** CDN 加速域名，用于拼接对外访问地址 */
    private String cdnDomain = "";
    /** 封面等公开元数据签名 URL 有效期（秒），默认 2 小时 */
    private int signExpireSeconds = 7200;
    /** 视频/字幕/资料下载类签名 URL 有效期（秒），默认 15 分钟 */
    private int mediaSignExpireSeconds = 900;
    /** 后台中转上传单文件上限（字节），默认 200MB */
    private long maxUploadBytes = 200L * 1024 * 1024;
}
