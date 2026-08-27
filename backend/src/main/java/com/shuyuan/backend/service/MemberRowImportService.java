package com.shuyuan.backend.service;

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
 * 师生账号三表建号。
 *
 * <ul>
 *   <li>{@link #insertSingle} — 单个新增，与外层 API 同事务提交；</li>
 *   <li>{@link #insertImportRow} — Excel 逐行，每行独立 REQUIRES_NEW。</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class MemberRowImportService {

    private final MemberMapper memberMapper;
    private final MemberAccountMapper memberAccountMapper;
    private final MemberProfileMapper memberProfileMapper;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /** 单个新增：与 AdminMemberService.create 同一事务，响应失败时可整体回滚 */
    @Transactional(rollbackFor = Exception.class)
    public Long insertSingle(String studentNo, String realName, String idCard,
                             String college, String grade, String phone) {
        return insertCore(studentNo, realName, idCard, college, grade, phone);
    }

    /** Excel 导入：每行独立提交，失败只回滚该行 */
    @Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = Exception.class)
    public Long insertImportRow(String studentNo, String realName, String idCard,
                              String college, String grade, String phone) {
        return insertCore(studentNo, realName, idCard, college, grade, phone);
    }

    private Long insertCore(String studentNo, String realName, String idCard,
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
