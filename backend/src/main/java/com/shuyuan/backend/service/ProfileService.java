package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.*;
import com.shuyuan.backend.mapper.*;
import com.shuyuan.backend.vo.MemberVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final MemberMapper memberMapper;
    private final MemberProfileMapper memberProfileMapper;
    private final FavoriteMapper favoriteMapper;
    private final EnrollMapper enrollMapper;
    private final DownloadRecordMapper downloadRecordMapper;
    private final EnrollService enrollService;

    public MemberVO profile() {
        Long memberId = requireMemberId();
        Member member = memberMapper.selectById(memberId);
        if (member == null) {
            throw new BusinessException(401, "请先登录");
        }
        MemberProfile profile = memberProfileMapper.selectById(memberId);
        return MemberVO.builder()
                .id(member.getId())
                .nickname(member.getNickname())
                .avatar(member.getAvatar())
                .college(profile != null ? profile.getCollege() : "贵州交通职业大学 · 中华文化书院")
                .points(member.getPoints())
                .build();
    }

    public Map<String, Object> stats() {
        Long memberId = requireMemberId();
        Member member = memberMapper.selectById(memberId);
        if (member == null) {
            throw new BusinessException(401, "请先登录");
        }
        long favorites = favoriteMapper.selectCount(new LambdaQueryWrapper<Favorite>()
                .eq(Favorite::getMemberId, memberId));
        long enrolls = enrollMapper.selectCount(new LambdaQueryWrapper<Enroll>()
                .eq(Enroll::getMemberId, memberId));
        long downloads = downloadRecordMapper.selectCount(new LambdaQueryWrapper<DownloadRecord>()
                .eq(DownloadRecord::getMemberId, memberId));

        Map<String, Object> m = new HashMap<>();
        m.put("favorites", favorites);
        m.put("enrolls", enrolls);
        m.put("downloads", downloads);
        m.put("points", member.getPoints() != null ? member.getPoints() : 0);
        return m;
    }

    public java.util.List<Map<String, Object>> enrolls() {
        return enrollService.myEnrolls();
    }

    private Long requireMemberId() {
        Long memberId = MemberContext.getMemberId();
        if (memberId == null) {
            throw new BusinessException(401, "请先登录");
        }
        return memberId;
    }
}
