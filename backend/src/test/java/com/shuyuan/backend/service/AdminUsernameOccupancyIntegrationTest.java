package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.context.AdminContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.AdminUserSaveRequest;
import com.shuyuan.backend.dto.AdminUsernameOccupancy;
import com.shuyuan.backend.entity.SysUser;
import com.shuyuan.backend.mapper.RecycleBinMapper;
import com.shuyuan.backend.mapper.SysUserMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 验证管理员登录名在软删后能被原生占用查询识别，且创建时返回业务冲突而非 500。
 * <p>需本地 shuyuan_test + Redis，并设 {@code RUN_MYSQL_IT=1}：
 * {@code RUN_MYSQL_IT=1 mvn test -Dtest=AdminUsernameOccupancyIntegrationTest}
 */
@SpringBootTest
@ActiveProfiles("test")
@EnabledIfEnvironmentVariable(named = "RUN_MYSQL_IT", matches = "1")
@Transactional
class AdminUsernameOccupancyIntegrationTest {

    @Autowired
    private AdminUserService adminUserService;
    @Autowired
    private SysUserMapper sysUserMapper;
    @Autowired
    private RecycleBinMapper recycleBinMapper;
    @Autowired
    private JdbcTemplate jdbc;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private String username;

    @BeforeEach
    void setUp() {
        username = "it_admin_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        AdminContext.set(999999L, 1L, Set.of("admin:super"));
    }

    @AfterEach
    void tearDown() {
        AdminContext.clear();
    }

    @Test
    void softDeletedUsername_blocksCreateUntilPurged() {
        Long roleId = requireNonSuperRoleId();
        SysUser user = new SysUser();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode("TempPass123456"));
        user.setRoleId(roleId);
        user.setStatus(1);
        user.setMustChangePassword(1);
        user.setTokenVersion(1);
        user.setCreateTime(LocalDateTime.now());
        user.setUpdateTime(LocalDateTime.now());
        sysUserMapper.insert(user);
        Long userId = user.getId();
        assertNotNull(userId);

        sysUserMapper.deleteById(userId);
        assertEquals(0L, sysUserMapper.selectCount(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getUsername, username)));
        AdminUsernameOccupancy occupied = sysUserMapper.findUsernameOccupancy(username);
        assertNotNull(occupied);
        assertEquals(userId, occupied.getId());
        assertTrue(occupied.recycled());

        AdminUserSaveRequest req = new AdminUserSaveRequest();
        req.setUsername(username);
        req.setRoleId(roleId);
        BusinessException blocked = assertThrows(BusinessException.class, () -> adminUserService.create(req));
        assertEquals(409, blocked.getCode());
        assertTrue(blocked.getMessage().contains("回收站"));

        assertEquals(1, recycleBinMapper.purge("sys_user", userId));
        assertNull(sysUserMapper.findUsernameOccupancy(username));

        var created = adminUserService.create(req);
        assertEquals(username, created.get("username"));
    }

    private Long requireNonSuperRoleId() {
        Long roleId = jdbc.queryForObject(
                "SELECT id FROM sys_role WHERE id <> 1 ORDER BY id LIMIT 1",
                Long.class);
        if (roleId == null) {
            throw new IllegalStateException("sys_role 缺少非超管角色，无法跑集成测");
        }
        return roleId;
    }
}
