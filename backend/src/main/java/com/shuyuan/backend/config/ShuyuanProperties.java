package com.shuyuan.backend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "shuyuan")
public class ShuyuanProperties {

    private Jwt jwt = new Jwt();
    private Wx wx = new Wx();
    private Login login = new Login();
    private RateLimit rateLimit = new RateLimit();
    private Ai ai = new Ai();
    private Subscribe subscribe = new Subscribe();
    private Alert alert = new Alert();
    private Cors cors = new Cors();
    private Security security = new Security();
    private Asr asr = new Asr();

    @Data
    public static class Login {
        /** 连续失败多少次后锁定 */
        private int maxFailAttempts = 5;
        /** 锁定时长（分钟） */
        private int lockMinutes = 5;
        /** 失败计数窗口（分钟），超时未再失败则清零 */
        private int failWindowMinutes = 15;
    }

    @Data
    public static class Jwt {
        private String secret = "shuyuan-dev-jwt-secret";
        /** 小程序会员 Token 有效期（天） */
        private int expireDays = 7;
        /** 管理后台 Token 有效期（小时），默认 8 小时 */
        private int adminExpireHours = 8;
    }

    @Data
    public static class Wx {
        /** 开发模式：不调微信接口，code 直接换 token */
        private boolean devMode = true;
        private String appid = "";
        private String secret = "";
    }

    /** 接口限流（Redis 固定窗口，E2-3） */
    @Data
    public static class RateLimit {
        private boolean enabled = true;
        /** 学号/账号登录：每 IP 每分钟 */
        private int loginPerMinute = 10;
        /** 微信登录：每 IP 每分钟 */
        private int wxLoginPerMinute = 20;
        /** 管理端登录：每 IP 每分钟 */
        private int adminLoginPerMinute = 10;
        /** 活动报名：每用户每分钟 */
        private int enrollPerMinute = 5;
        /** AI 问答（预留）：每用户每天 */
        private int aiPerDay = 20;
    }

    /** AI 问答（Phase 7） */
    @Data
    public static class Ai {
        /** fallback=无 Key 时基于知识库片段作答；zhipu=智谱 GLM */
        private String provider = "fallback";
        private String apiKey = "";
        private String baseUrl = "https://open.bigmodel.cn/api/paas/v4";
        private String model = "glm-4-flash";
        private int dailyLimit = 20;
        private int maxChunks = 5;
    }

    /** 微信订阅消息模板（生产环境在公众平台申请后填入） */
    @Data
    public static class Subscribe {
        private String enrollSuccessTemplateId = "";
        private String enrollApprovedTemplateId = "";
        private String activityRemindTemplateId = "";
    }

    /** E2-1 低成本告警：钉钉 / 企业微信 Webhook */
    @Data
    public static class Alert {
        /** 默认关闭；staging/prod 配置 webhook 后开启 */
        private boolean enabled = false;
        private String webhookUrl = "";
        /** 错误率统计窗口（分钟），与定时任务周期一致 */
        private int windowMinutes = 5;
        /** 5xx 错误率阈值（百分比） */
        private double errorRatePercent = 1.0;
        /** 窗口内最少请求数，低于此值不告警（避免低流量误报） */
        private int minSampleSize = 20;
        /** 同类告警冷却时间（分钟） */
        private int cooldownMinutes = 15;
    }

    /** staging/prod CORS 白名单（dev 仍允许 *） */
    @Data
    public static class Cors {
        private java.util.List<String> allowedOriginPatterns = java.util.List.of();
    }

    /** 反代与客户端 IP 解析 */
    @Data
    public static class Security {
        /** 为 true 且 remoteAddr 属于 trustedProxies 时才读取转发头 */
        private boolean trustForwardedHeaders = false;
        private java.util.List<String> trustedProxies = java.util.List.of(
                "127.0.0.1",
                "::1",
                "10.0.0.0/8",
                "172.16.0.0/12",
                "192.168.0.0/16");
    }

    /** 课程字幕 ASR（阿里云录音文件识别） */
    @Data
    public static class Asr {
        /** none | aliyun */
        private String provider = "none";
        private String accessKeyId = "";
        private String accessKeySecret = "";
        private String appKey = "";
        private String region = "cn-shanghai";
    }
}
