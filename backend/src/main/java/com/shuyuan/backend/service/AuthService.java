package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.AccountLoginRequest;
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

    /** 师生自助改密（导入账号首次登录须完成） */
    @Transactional
    public LoginVO changePassword(String oldPassword, String newPassword) {
        Long memberId = MemberContext.getMemberId();
        if (memberId == null) {
            throw new BusinessException(401, "请先登录");
        }
        if (oldPassword == null || oldPassword.isBlank() || newPassword == null || newPassword.isBlank()) {
            throw new BusinessException(400, "请填写原密码与新密码");
        }
        MemberPasswordPolicy.validate(newPassword);
        if (oldPassword.equals(newPassword)) {
            throw new BusinessException(400, "新密码不能与原密码相同");
        }

        Member member = memberMapper.selectById(memberId);
        if (member == null) {
            throw new BusinessException(401, "请先登录");
        }
        checkMemberActive(member);

        MemberAccount account = memberAccountMapper.selectOne(new LambdaQueryWrapper<MemberAccount>()
                .eq(MemberAccount::getMemberId, memberId)
                .last("LIMIT 1"));
        if (account == null || account.getStatus() == null || account.getStatus() != 1) {
            throw new BusinessException(403, "账号不可用");
        }
        if (!passwordEncoder.matches(oldPassword, account.getPasswordHash())) {
            throw new BusinessException(400, "原密码不正确");
        }

        account.setPasswordHash(passwordEncoder.encode(newPassword));
        account.setMustChangePassword(0);
        memberAccountMapper.updateById(account);
        return buildLogin(member);
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
        String token = jwtUtils.createToken(member.getId(), member.getOpenid());
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
                .college(profile != null ? profile.getCollege() : null)
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
