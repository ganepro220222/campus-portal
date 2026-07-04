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
