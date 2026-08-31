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
    /**
     * ECS 同地域内网 Endpoint（如 {@code https://oss-cn-chengdu-internal.aliyuncs.com}）。
     * 只给上传/删除/读对象用；本机不要配，签名和对外 URL 仍用 {@link #endpoint}。
     */
    private String internalEndpoint = "";
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
    /** 孤儿对象最短存活小时数，避免删掉已上传尚未点保存的文件 */
    private int orphanMinAgeHours = 48;
    /**
     * 是否启用每日孤儿扫描。默认关闭：扫桶是唯一「主动找对象删」的路径，
     * 引用扫描若漏了某张新表就会误删在用素材，须在预发验证一二期后再显式开启。
     */
    private boolean orphanSweepEnabled = false;
    /**
     * 单轮最多删除的孤儿数。超过则整轮中止并打 error，防止引用扫描异常时误清桶。
     */
    private int orphanSweepMaxDeletes = 80;
}
