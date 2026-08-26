package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.SysUser;
import com.shuyuan.backend.mapper.SysUserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * 高危操作的二次身份确认。
 *
 * <p>用在「会连带清掉业务数据的彻底删除」上：光有 JWT 不够——浏览器可能是别人替老师点开的，
 * 也可能是标签页忘了关。要求当场重输一次登录密码，把「谁在操作」重新钉一遍。
 *
 * <p>不做成拦截器，是因为只有少数几个动作需要它，且这几处都要在业务校验之后、
 * 真正落库之前才触发——放拦截器里会在还没算出影响面时就先弹密码框。
 */
@Service
@RequiredArgsConstructor
public class DangerousActionGuard {

    private final SysUserMapper sysUserMapper;
    private final AdminPermissionService adminPermissionService;
    private final LoginLockService loginLockService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * 校验当前登录管理员刚输入的密码。
     *
     * @throws BusinessException 400 未填密码 / 密码错误；403 账号已停用
     */
    public void verifyCurrentAdminPassword(String password) {
        Long adminId = adminPermissionService.requireAdminId();
        if (password == null || password.isBlank()) {
            throw new BusinessException(400, "该操作需要输入当前管理员密码确认");
        }
        SysUser user = sysUserMapper.selectById(adminId);
        if (user == null || user.getStatus() == null || user.getStatus() != 1) {
            throw new BusinessException(403, "账号不可用");
        }
        // 走和登录同一套锁定计数：高危口令同样不许被在线爆破
        loginLockService.ensureNotLocked(LoginLockService.SCENE_ADMIN, user.getUsername());
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            loginLockService.onFailure(LoginLockService.SCENE_ADMIN, user.getUsername());
            throw new BusinessException(400, "管理员密码不正确");
        }
        loginLockService.onSuccess(LoginLockService.SCENE_ADMIN, user.getUsername());
    }
}
