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

        Map<String, Object> m = LoginHelpService.build(login, new ShuyuanProperties.MemberNo(), Map.of());

        assertEquals(3, m.get("maxFailAttempts"));
        assertEquals(30, m.get("lockMinutes"));
        assertEquals(60, m.get("failWindowMinutes"));
    }

    @Test
    void 默认值与锁定服务一致() {
        Map<String, Object> m = LoginHelpService.build(new ShuyuanProperties.Login(), new ShuyuanProperties.MemberNo(), null);

        assertEquals(5, m.get("maxFailAttempts"));
        assertEquals(5, m.get("lockMinutes"));
        assertEquals(15, m.get("failWindowMinutes"));
    }

    @Test
    void 联系方式取关于页并去空白_缺了给空串不给null() {
        Map<String, Object> about = new HashMap<>();
        about.put("phone", " 0851-1234567 ");
        about.put("email", null);

        Map<String, Object> m = LoginHelpService.build(new ShuyuanProperties.Login(), new ShuyuanProperties.MemberNo(), about);

        assertEquals("0851-1234567", m.get("phone"));
        assertEquals("", m.get("email"));
    }

    @Test
    void 位数跟着配置走_任一设0两项都给0() {
        Map<String, Object> m = LoginHelpService.build(new ShuyuanProperties.Login(), new ShuyuanProperties.MemberNo(), null);
        assertEquals(12, m.get("studentDigits"));
        assertEquals(7, m.get("staffDigits"));

        ShuyuanProperties.MemberNo off = new ShuyuanProperties.MemberNo();
        off.setStaffDigits(0);
        Map<String, Object> o = LoginHelpService.build(new ShuyuanProperties.Login(), off, null);
        assertEquals(0, o.get("studentDigits"));
        assertEquals(0, o.get("staffDigits"));
    }
}
