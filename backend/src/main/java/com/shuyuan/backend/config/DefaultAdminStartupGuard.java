package com.shuyuan.backend.config;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.entity.SysUser;
import com.shuyuan.backend.mapper.SysUserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;

/**
 * 生产环境启动门禁：禁止启用中的默认超管口令 admin/Admin@123。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DefaultAdminStartupGuard implements ApplicationRunner {

    public static final String DEFAULT_ADMIN_USERNAME = "admin";
    public static final String DEFAULT_ADMIN_PASSWORD = "Admin@123";

    private final Environment environment;
    private final SysUserMapper sysUserMapper;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public void run(ApplicationArguments args) {
        if (!isProdProfile(environment.getActiveProfiles())) {
            return;
        }
        SysUser admin = sysUserMapper.selectOne(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getUsername, DEFAULT_ADMIN_USERNAME)
                .eq(SysUser::getStatus, 1)
                .last("LIMIT 1"));
        if (admin == null) {
            log.info("生产环境未检测到启用的默认 admin 账号，跳过默认口令校验");
            return;
        }
        if (passwordEncoder.matches(DEFAULT_ADMIN_PASSWORD, admin.getPasswordHash())) {
            throw new IllegalStateException(
                    "生产环境禁止使用默认超管口令 admin/Admin@123，请重置强密码、禁用该账号或创建新的超管后再启动");
        }
        log.info("生产环境默认超管口令校验通过");
    }

    static boolean isProdProfile(String[] profiles) {
        if (profiles == null) {
            return false;
        }
        return Arrays.stream(profiles).anyMatch(p -> "prod".equalsIgnoreCase(p));
    }
}
