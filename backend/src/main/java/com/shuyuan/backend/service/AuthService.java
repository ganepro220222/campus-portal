package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.AccountLoginRequest;
import com.shuyuan.backend.dto.MemberChangePasswordRequest;
import com.shuyuan.backend.dto.WxBindRequest;
import com.shuyuan.backend.dto.WxLoginRequest;
import com.shuyuan.backend.entity.Member;
import com.shuyuan.backend.entity.MemberAccount;
import com.shuyuan.backend.entity.MemberProfile;
import com.shuyuan.backend.mapper.MemberAccountMapper;
import com.shuyuan.backend.mapper.MemberMapper;
import com.shuyuan.backend.mapper.MemberProfileMapper;
import com.shuyuan.backend.util.JwtUtils;
import com.shuyuan.backend.util.MemberPasswordPolicy;
import com.shuyuan.backend.util.StudentPasswordPolicy;
import com.shuyuan.backend.util.TokenVersionSupport;
import com.shuyuan.backend.vo.LoginVO;
import com.shuyuan.backend.vo.MemberVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final MemberMapper memberMapper;
    private final MemberAccountMapper memberAccountMapper;
    private final MemberProfileMapper memberProfileMapper;
    private final JwtUtils jwtUtils;
    private final LoginLockService loginLockService;
    private final PointService pointService;
    private final WxSessionService wxSessionService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * 微信登录：已绑定用户直接登录；未绑定返回 needBind + wxBindToken（不自动建号）。
     */
    public LoginVO wxLogin(WxLoginRequest req) {
        String openid = wxSessionService.resolveOpenid(req.getCode());
        Member member = memberMapper.selectOne(new LambdaQueryWrapper<Member>()
                .eq(Member::getOpenid, openid)
                .last("LIMIT 1"));
        if (member != null) {
            checkMemberActive(member);
            return buildLogin(member);
        }
        return LoginVO.builder()
                .needBind(true)
                .wxBindToken(jwtUtils.createWxBindToken(openid))
                .build();
    }

    /** 微信首次登录：用学号密码核验后绑定 openid */
    @Transactional
    public LoginVO bindWxAccount(WxBindRequest req) {
        String wxOpenid = jwtUtils.parseWxBindOpenid(req.getWxBindToken());
        if (wxOpenid == null) {
            throw new BusinessException(400, "绑定凭证无效或已过期，请重新微信登录");
        }
        MemberAccount account = verifyAccountCredentials(req.getStudentNo(), req.getPassword());
        Member member = memberMapper.selectById(account.getMemberId());
        if (member == null) {
            throw new BusinessException(401, "账号或密码错误");
        }
        checkMemberActive(member);
        ensureWxOpenidAvailable(wxOpenid, member.getId());
        if (!StudentPasswordPolicy.isPlaceholderOpenid(member.getOpenid())) {
            throw new BusinessException(400, "该学号已绑定其他微信，请联系管理员");
        }
        member.setOpenid(wxOpenid);
        memberMapper.updateById(member);
        loginLockService.onSuccess(LoginLockService.SCENE_MEMBER, req.getStudentNo().trim());
        return buildLogin(member);
    }

    /** 已学号登录用户绑定当前微信 */
    @Transactional
    public LoginVO bindWxForCurrentUser(WxLoginRequest req) {
        Long memberId = MemberContext.getMemberId();
        if (memberId == null) {
            throw new BusinessException(401, "请先登录");
        }
        Member member = memberMapper.selectById(memberId);
        if (member == null) {
            throw new BusinessException(401, "请先登录");
        }
        checkMemberActive(member);
        if (!StudentPasswordPolicy.isPlaceholderOpenid(member.getOpenid())) {
            throw new BusinessException(400, "当前账号已绑定微信");
        }
        String wxOpenid = wxSessionService.resolveOpenid(req.getCode());
        ensureWxOpenidAvailable(wxOpenid, memberId);
        member.setOpenid(wxOpenid);
        memberMapper.updateById(member);
        return buildLogin(member);
    }

    public LoginVO accountLogin(AccountLoginRequest req) {
        String accountKey = req.getStudentNo() != null ? req.getStudentNo().trim() : "";
        if (accountKey.isEmpty()) {
            throw new BusinessException(400, "学号/账号不能为空");
        }

        loginLockService.ensureNotLocked(LoginLockService.SCENE_MEMBER, accountKey);
        MemberAccount account = verifyAccountCredentials(accountKey, req.getPassword());
        Member member = memberMapper.selectById(account.getMemberId());
        if (member == null) {
            loginLockService.onFailure(LoginLockService.SCENE_MEMBER, accountKey);
            throw new BusinessException(401, "账号或密码错误");
        }
        checkMemberActive(member);
        loginLockService.onSuccess(LoginLockService.SCENE_MEMBER, accountKey);
        return buildLogin(member);
    }

    /**
     * 师生改密，三条互不替代的入口：
     * <ol>
     *   <li>微信 jscode：openid 已绑定该学号，可不再校验原密码（登录页「忘记密码」）；</li>
     *   <li>已登录且 {@code mustChangePassword}：刚用初始/临时密码或微信进过门，不再重复要原密码；</li>
     *   <li>已登录日常改密：必须原密码正确。只持有普通微信 JWT 不能跳过——
     *       防止别人拿着未锁的手机直接改掉密码。</li>
     * </ol>
     */
    @Transactional
    public LoginVO changePassword(MemberChangePasswordRequest req) {
        if (req == null || req.getNewPassword() == null || req.getNewPassword().isBlank()) {
            throw new BusinessException(400, "请填写新密码");
        }
        String newPassword = req.getNewPassword();
        MemberPasswordPolicy.validate(newPassword);

        String wxCode = trimToNull(req.getWxCode());
        Member member;
        MemberAccount account;
        if (wxCode != null) {
            member = resolveBoundMemberByWxCode(wxCode);
            account = requireActiveAccount(member.getId());
        } else {
            Long memberId = MemberContext.getMemberId();
            if (memberId == null) {
                throw new BusinessException(401, "请先登录");
            }
            member = memberMapper.selectById(memberId);
            if (member == null) {
                throw new BusinessException(401, "请先登录");
            }
            checkMemberActive(member);
            account = requireActiveAccount(memberId);
            if (!MemberContext.mustChangePassword()) {
                verifyCurrentPassword(account, trimToNull(req.getOldPassword()), newPassword);
            }
        }

        if (passwordEncoder.matches(newPassword, account.getPasswordHash())) {
            throw new BusinessException(400, "新密码不能与当前密码相同");
        }

        account.setPasswordHash(passwordEncoder.encode(newPassword));
        account.setMustChangePassword(0);
        memberAccountMapper.updateById(account);

        member.setTokenVersion(TokenVersionSupport.bump(member.getTokenVersion()));
        memberMapper.updateById(member);

        return buildLogin(memberMapper.selectById(member.getId()));
    }

    /** 用当场取得的 wx.login code 认定「就是这个微信的主人」 */
    private Member resolveBoundMemberByWxCode(String wxCode) {
        String openid = wxSessionService.resolveOpenid(wxCode);
        Member member = memberMapper.selectOne(new LambdaQueryWrapper<Member>()
                .eq(Member::getOpenid, openid)
                .last("LIMIT 1"));
        if (member == null || StudentPasswordPolicy.isPlaceholderOpenid(member.getOpenid())) {
            throw new BusinessException(400, "该微信尚未绑定学号账号，请联系学院管理员重置密码");
        }
        Long currentId = MemberContext.getMemberId();
        if (currentId != null && !currentId.equals(member.getId())) {
            throw new BusinessException(400, "微信与当前登录账号不一致，请先退出后再试");
        }
        checkMemberActive(member);
        return member;
    }

    private void verifyCurrentPassword(MemberAccount account, String oldPassword, String newPassword) {
        if (oldPassword == null) {
            throw new BusinessException(400, "请填写原密码");
        }
        if (oldPassword.equals(newPassword)) {
            throw new BusinessException(400, "新密码不能与原密码相同");
        }
        String lockKey = accountLockKey(account);
        loginLockService.ensureNotLocked(LoginLockService.SCENE_MEMBER, lockKey);
        if (!passwordEncoder.matches(oldPassword, account.getPasswordHash())) {
            LoginLockService.FailureState state =
                    loginLockService.registerFailure(LoginLockService.SCENE_MEMBER, lockKey);
            if (state.locked()) {
                throw new BusinessException(429,
                        "连续登录失败次数过多，请" + state.lockMinutes() + "分钟后再试");
            }
            throw new BusinessException(400, "原密码不正确");
        }
        loginLockService.onSuccess(LoginLockService.SCENE_MEMBER, lockKey);
    }

    private MemberAccount requireActiveAccount(Long memberId) {
        MemberAccount account = memberAccountMapper.selectOne(new LambdaQueryWrapper<MemberAccount>()
                .eq(MemberAccount::getMemberId, memberId)
                .last("LIMIT 1"));
        if (account == null || account.getStatus() == null || account.getStatus() != 1) {
            throw new BusinessException(403, "账号不可用");
        }
        return account;
    }

    private static String accountLockKey(MemberAccount account) {
        if (account.getStudentNo() != null && !account.getStudentNo().isBlank()) {
            return account.getStudentNo();
        }
        return "id:" + account.getMemberId();
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private MemberAccount verifyAccountCredentials(String accountKey, String password) {
        if (accountKey == null || accountKey.isBlank()) {
            throw new BusinessException(400, "学号/账号不能为空");
        }
        if (password == null || password.isBlank()) {
            throw new BusinessException(400, "密码不能为空");
        }
        MemberAccount account = memberAccountMapper.selectOne(new LambdaQueryWrapper<MemberAccount>()
                .and(w -> w.eq(MemberAccount::getStudentNo, accountKey.trim())
                        .or()
                        .eq(MemberAccount::getUsername, accountKey.trim()))
                .eq(MemberAccount::getStatus, 1)
                .last("LIMIT 1"));
        boolean passwordOk = account != null
                && passwordEncoder.matches(password, account.getPasswordHash());
        if (!passwordOk) {
            loginLockService.onFailure(LoginLockService.SCENE_MEMBER, accountKey.trim());
            throw new BusinessException(401, "账号或密码错误");
        }
        return account;
    }

    private void ensureWxOpenidAvailable(String wxOpenid, Long currentMemberId) {
        Member occupied = memberMapper.selectOne(new LambdaQueryWrapper<Member>()
                .eq(Member::getOpenid, wxOpenid)
                .last("LIMIT 1"));
        if (occupied != null && !occupied.getId().equals(currentMemberId)) {
            throw new BusinessException(400, "该微信已绑定其他账号");
        }
    }

    private void checkMemberActive(Member member) {
        if (member.getStatus() != null && member.getStatus() == 0) {
            throw new BusinessException(403, "账号已被禁用");
        }
    }

    private LoginVO buildLogin(Member member) {
        pointService.award(member.getId(), "login");
        member = memberMapper.selectById(member.getId());
        int tokenVersion = TokenVersionSupport.current(member.getTokenVersion());
        String token = jwtUtils.createToken(member.getId(), member.getOpenid(), tokenVersion);
        MemberProfile profile = memberProfileMapper.selectById(member.getId());
        MemberAccount account = memberAccountMapper.selectOne(new LambdaQueryWrapper<MemberAccount>()
                .eq(MemberAccount::getMemberId, member.getId())
                .last("LIMIT 1"));
        boolean mustChange = account != null
                && account.getMustChangePassword() != null
                && account.getMustChangePassword() == 1;
        MemberVO vo = MemberVO.builder()
                .id(member.getId())
                .nickname(member.getNickname())
                .avatar(member.getAvatar())
                .realName(profile != null ? profile.getRealName() : null)
                .college(profile != null ? profile.getCollege() : null)
                .grade(profile != null ? profile.getGrade() : null)
                .phone(profile != null ? profile.getPhone() : null)
                .points(member.getPoints())
                .build();
        return LoginVO.builder()
                .token(token)
                .member(vo)
                .needBind(false)
                .wxBound(!StudentPasswordPolicy.isPlaceholderOpenid(member.getOpenid()))
                .mustChangePassword(mustChange)
                .build();
    }
}
