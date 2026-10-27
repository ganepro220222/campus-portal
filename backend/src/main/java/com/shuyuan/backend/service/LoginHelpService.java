package com.shuyuan.backend.service;

import com.shuyuan.backend.config.ShuyuanProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 小程序「无法登录」问答用的实际值：锁定次数与时长（可被环境变量改，不能写死在问答里）、
 * 「关于」页的联系方式。只读、无个人信息，未登录可取。
 */
@Service
@RequiredArgsConstructor
public class LoginHelpService {

    private final ShuyuanProperties properties;
    private final SysConfigService sysConfigService;

    public Map<String, Object> loginHelp() {
        return build(properties.getLogin(), sysConfigService.getAboutConfig());
    }

    static Map<String, Object> build(ShuyuanProperties.Login login, Map<String, Object> about) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("maxFailAttempts", login.getMaxFailAttempts());
        m.put("lockMinutes", login.getLockMinutes());
        m.put("failWindowMinutes", login.getFailWindowMinutes());
        m.put("phone", text(about, "phone"));
        m.put("email", text(about, "email"));
        return m;
    }

    private static String text(Map<String, Object> about, String key) {
        if (about == null) {
            return "";
        }
        Object v = about.get(key);
        return v == null ? "" : String.valueOf(v).trim();
    }
}
