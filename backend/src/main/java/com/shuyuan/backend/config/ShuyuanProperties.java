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
        private int expireDays = 7;
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
}
