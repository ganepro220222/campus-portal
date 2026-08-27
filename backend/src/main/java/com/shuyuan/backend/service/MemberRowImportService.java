package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.Member;
import com.shuyuan.backend.entity.MemberAccount;
import com.shuyuan.backend.entity.MemberProfile;
import com.shuyuan.backend.mapper.MemberAccountMapper;
import com.shuyuan.backend.mapper.MemberMapper;
import com.shuyuan.backend.mapper.MemberProfileMapper;
import com.shuyuan.backend.util.StudentPasswordPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * 师生账号三表建号：Excel 导入时每行独立事务，单行失败只回滚该行。
 *
 * <p>须为独立 Bean：同类内部 {@code @Transactional(REQUIRES_NEW)} 不经过 Spring 代理不会生效。
 */
@Service
@RequiredArgsConstructor
public class MemberRowImportService {

    private final MemberMapper memberMapper;
    private final MemberAccountMapper memberAccountMapper;
    private final MemberProfileMapper memberProfileMapper;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * member → member_account → member_profile，任一步失败则本行全部回滚。
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = Exception.class)
    public Long insertRow(String studentNo, String realName, String idCard,
                          String college, String grade, String phone) {
        String plainPassword = StudentPasswordPolicy.resolveInitialPassword(studentNo, idCard);

        Member member = new Member();
        member.setOpenid(StudentPasswordPolicy.placeholderOpenid(studentNo));
        member.setNickname(realName);
        member.setPoints(0);
        member.setStatus(1);
        memberMapper.insert(member);

        MemberAccount account = new MemberAccount();
        account.setMemberId(member.getId());
        account.setStudentNo(studentNo);
        account.setUsername(studentNo);
        account.setPasswordHash(passwordEncoder.encode(plainPassword));
        account.setStatus(1);
        account.setMustChangePassword(1);
        memberAccountMapper.insert(account);

        MemberProfile profile = new MemberProfile();
        profile.setMemberId(member.getId());
        profile.setRealName(realName);
        profile.setCollege(college);
        profile.setGrade(grade);
        profile.setPhone(phone);
        memberProfileMapper.insert(profile);

        return member.getId();
    }
}
