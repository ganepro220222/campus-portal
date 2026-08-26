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
        // 单独一把锁：会话可能是别人捡到的，仍要防在线爆破，
        // 但计数不能记在登录那把锁上，否则确认框里手滑几次会把后台登录一起锁掉
        loginLockService.ensureNotLocked(LoginLockService.SCENE_ADMIN_DANGER, user.getUsername());

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            LoginLockService.FailureState state = loginLockService.registerFailure(
                    LoginLockService.SCENE_ADMIN_DANGER, user.getUsername());
            if (state.locked()) {
                throw new BusinessException(429,
                        "密码错误次数过多，请" + state.lockMinutes() + "分钟后再试");
            }
            // 必须是 400：401 会被前端拦截器当成登录过期，清会话跳登录页——
            // 在删除确认框里打错一次密码就被踢出后台
            throw new BusinessException(400,
                    "管理员密码不正确，还可尝试 " + state.remaining() + " 次");
        }

        loginLockService.onSuccess(LoginLockService.SCENE_ADMIN_DANGER, user.getUsername());
    }
}
