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
}
