package com.shuyuan.backend.service;

import com.shuyuan.backend.config.ShuyuanProperties;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LoginHelpServiceTest {

    @Test
    void 锁定数值跟着配置走() {
        ShuyuanProperties.Login login = new ShuyuanProperties.Login();
        login.setMaxFailAttempts(3);
        login.setLockMinutes(30);
        login.setFailWindowMinutes(60);

        Map<String, Object> m = LoginHelpService.build(login, Map.of());

        assertEquals(3, m.get("maxFailAttempts"));
        assertEquals(30, m.get("lockMinutes"));
        assertEquals(60, m.get("failWindowMinutes"));
    }

    @Test
    void 默认值与锁定服务一致() {
        Map<String, Object> m = LoginHelpService.build(new ShuyuanProperties.Login(), null);

        assertEquals(5, m.get("maxFailAttempts"));
        assertEquals(5, m.get("lockMinutes"));
        assertEquals(15, m.get("failWindowMinutes"));
    }

    @Test
    void 联系方式取关于页并去空白_缺了给空串不给null() {
        Map<String, Object> about = new HashMap<>();
        about.put("phone", " 0851-1234567 ");
        about.put("email", null);

        Map<String, Object> m = LoginHelpService.build(new ShuyuanProperties.Login(), about);

        assertEquals("0851-1234567", m.get("phone"));
        assertEquals("", m.get("email"));
    }
}
