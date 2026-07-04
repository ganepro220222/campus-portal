package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.config.ShuyuanProperties;
import com.shuyuan.backend.dto.AccountLoginRequest;
import com.shuyuan.backend.dto.WxLoginRequest;
import com.shuyuan.backend.entity.Member;
import com.shuyuan.backend.entity.MemberAccount;
import com.shuyuan.backend.entity.MemberProfile;
import com.shuyuan.backend.mapper.MemberAccountMapper;
import com.shuyuan.backend.mapper.MemberMapper;
import com.shuyuan.backend.mapper.MemberProfileMapper;
import com.shuyuan.backend.util.JwtUtils;
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
    private final ShuyuanProperties properties;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Transactional
    public LoginVO wxLogin(WxLoginRequest req) {
        String openid = resolveOpenid(req.getCode());
        Member member = memberMapper.selectOne(new LambdaQueryWrapper<Member>()
                .eq(Member::getOpenid, openid)
                .last("LIMIT 1"));
        if (member == null) {
            member = new Member();
            member.setOpenid(openid);
            member.setNickname("书院用户");
            member.setPoints(0);
            member.setStatus(1);
            memberMapper.insert(member);
        }
        checkMemberActive(member);
        return buildLogin(member);
    }

    public LoginVO accountLogin(AccountLoginRequest req) {
        MemberAccount account = memberAccountMapper.selectOne(new LambdaQueryWrapper<MemberAccount>()
                .and(w -> w.eq(MemberAccount::getStudentNo, req.getStudentNo())
                        .or()
                        .eq(MemberAccount::getUsername, req.getStudentNo()))
                .eq(MemberAccount::getStatus, 1)
                .last("LIMIT 1"));
        if (account == null || !passwordEncoder.matches(req.getPassword(), account.getPasswordHash())) {
            throw new BusinessException(401, "账号或密码错误");
        }
        Member member = memberMapper.selectById(account.getMemberId());
        if (member == null) {
            throw new BusinessException(401, "账号或密码错误");
        }
        checkMemberActive(member);
        return buildLogin(member);
    }

    private String resolveOpenid(String code) {
        if (properties.getWx().isDevMode()) {
            return "dev_" + code;
        }
        // 生产环境需对接微信 code2session，此处留待配置 appid/secret 后实现
        throw new BusinessException("微信登录暂未配置，请联系管理员");
    }

    private void checkMemberActive(Member member) {
        if (member.getStatus() != null && member.getStatus() == 0) {
            throw new BusinessException(403, "账号已被禁用");
        }
    }

    private LoginVO buildLogin(Member member) {
        String token = jwtUtils.createToken(member.getId(), member.getOpenid());
        MemberProfile profile = memberProfileMapper.selectById(member.getId());
        MemberVO vo = MemberVO.builder()
                .id(member.getId())
                .nickname(member.getNickname())
                .avatar(member.getAvatar())
                .college(profile != null ? profile.getCollege() : null)
                .points(member.getPoints())
                .build();
        return LoginVO.builder().token(token).member(vo).build();
    }
}
