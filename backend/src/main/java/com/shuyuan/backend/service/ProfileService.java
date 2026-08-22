package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.ProfileUpdateRequest;
import com.shuyuan.backend.entity.*;
import com.shuyuan.backend.mapper.*;
import com.shuyuan.backend.util.FormatUtils;
import com.shuyuan.backend.vo.MemberVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * 个人中心读服务（docs Phase 4 个人中心、交付物 §2.10）
 */
@Service
@RequiredArgsConstructor
public class ProfileService {

    private final MemberMapper memberMapper;
    private final MemberProfileMapper memberProfileMapper;
    private final FavoriteMapper favoriteMapper;
    private final EnrollMapper enrollMapper;
    private final DownloadRecordMapper downloadRecordMapper;
    private final EventLogMapper eventLogMapper;
    private final BadgeMapper badgeMapper;
    private final MemberBadgeMapper memberBadgeMapper;
    private final NewsMapper newsMapper;
    private final HallMapper hallMapper;
    private final CraftMapper craftMapper;
    private final CourseMapper courseMapper;
    private final ResourceMapper resourceMapper;
    private final ActivityMapper activityMapper;
    private final EnrollService enrollService;
    private final MessageService messageService;
    private final BadgeGrantService badgeGrantService;

    public MemberVO profile() {
        Long memberId = requireMemberId();
        Member member = memberMapper.selectById(memberId);
        if (member == null) {
            throw new BusinessException(401, "请先登录");
        }
        return toMemberVo(member, memberProfileMapper.selectById(memberId));
    }

    /** 更新个人资料（member_profile 为主，昵称可选更新 member） */
    @Transactional
    public MemberVO updateProfile(ProfileUpdateRequest req) {
        Long memberId = requireMemberId();
        Member member = memberMapper.selectById(memberId);
        if (member == null) {
            throw new BusinessException(401, "请先登录");
        }

        String realName = trim(req.getRealName());
        String phone = trim(req.getPhone());
        if (realName.isBlank()) {
            throw new BusinessException(400, "请填写姓名");
        }
        if (phone.isBlank()) {
            throw new BusinessException(400, "请填写手机号");
        }
        if (!isValidCnMobile(phone)) {
            throw new BusinessException(400, "手机号格式不正确");
        }

        String nickname = trim(req.getNickname());
        if (!nickname.isBlank()) {
            Member nickUpdate = new Member();
            nickUpdate.setId(memberId);
            nickUpdate.setNickname(nickname);
            memberMapper.updateById(nickUpdate);
            member.setNickname(nickname);
        }

        MemberProfile profile = memberProfileMapper.selectById(memberId);
        boolean insert = profile == null;
        if (insert) {
            profile = new MemberProfile();
            profile.setMemberId(memberId);
        }
        profile.setRealName(realName);
        profile.setCollege(trim(req.getCollege()));
        profile.setGrade(trim(req.getGrade()));
        profile.setPhone(phone);
        profile.setUpdateTime(LocalDateTime.now());
        if (insert) {
            memberProfileMapper.insert(profile);
        } else {
            memberProfileMapper.updateById(profile);
        }

        member = memberMapper.selectById(memberId);
        return toMemberVo(member, profile);
    }

    private MemberVO toMemberVo(Member member, MemberProfile profile) {
        // 没填所属机构时接口回填的展示串。原先回填的是「贵州交通职业大学 · 中华文化书院」，
        // 这才是个人中心顶部打出学校名号的源头——小程序侧把它当占位串归一化了，
        // 但源头不改，其它调用方（后台、导出）仍会拿到它。
        // 旧串已落在历史数据里，miniapp/utils/profileForm.js 的 PLACEHOLDER_COLLEGES 继续认它。
        String college = profile != null && profile.getCollege() != null && !profile.getCollege().isBlank()
                ? profile.getCollege()
                : "中华文化书院";
        return MemberVO.builder()
                .id(member.getId())
                .nickname(member.getNickname())
                .avatar(member.getAvatar())
                .realName(profile != null ? profile.getRealName() : null)
                .college(college)
                .grade(profile != null ? profile.getGrade() : null)
                .phone(profile != null ? profile.getPhone() : null)
                .points(member.getPoints())
                .build();
    }

    private static String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private static boolean isValidCnMobile(String phone) {
        return phone != null && phone.matches("^1[3-9]\\d{9}$");
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
                .eq(Enroll::getMemberId, memberId)
                .ne(Enroll::getStatus, "cancelled"));
        long downloads = downloadRecordMapper.selectCount(new LambdaQueryWrapper<DownloadRecord>()
                .eq(DownloadRecord::getMemberId, memberId));

        Map<String, Object> m = new HashMap<>();
        m.put("favorites", favorites);
        m.put("enrolls", enrolls);
        m.put("downloads", downloads);
        m.put("points", member.getPoints() != null ? member.getPoints() : 0);
        m.put("unreadMessages", messageService.unreadCount(memberId));
        return m;
    }

    public List<Map<String, Object>> enrolls() {
        return enrollService.myEnrolls();
    }

    /** 收藏汇总（动态/展馆/文创/课程/资源） */
    public List<Map<String, Object>> favorites() {
        Long memberId = requireMemberId();
        List<Favorite> list = favoriteMapper.selectList(new LambdaQueryWrapper<Favorite>()
                .eq(Favorite::getMemberId, memberId)
                .orderByDesc(Favorite::getCreateTime));
        List<Map<String, Object>> result = new ArrayList<>();
        for (Favorite fav : list) {
            Map<String, Object> item = resolveFavoriteItem(fav);
            if (item != null) {
                result.add(item);
            }
        }
        return result;
    }

    /** 下载记录 */
    public List<Map<String, Object>> downloads() {
        Long memberId = requireMemberId();
        List<DownloadRecord> list = downloadRecordMapper.selectList(new LambdaQueryWrapper<DownloadRecord>()
                .eq(DownloadRecord::getMemberId, memberId)
                .orderByDesc(DownloadRecord::getDownloadedAt));
        List<Map<String, Object>> result = new ArrayList<>();
        for (DownloadRecord record : list) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", record.getId());
            m.put("resourceId", record.getResourceId());
            m.put("fileName", record.getFileName());
            m.put("downloadedAt", FormatUtils.formatDateTime(record.getDownloadedAt()));
            Resource resource = record.getResourceId() != null
                    ? resourceMapper.selectById(record.getResourceId()) : null;
            m.put("fileType", resource != null ? resource.getFileType() : "");
            result.add(m);
        }
        return result;
    }

    /** 学习足迹（最近 30 天） */
    public List<Map<String, Object>> footprints() {
        Long memberId = requireMemberId();
        LocalDateTime since = LocalDateTime.now().minusDays(30);
        List<EventLog> list = eventLogMapper.selectList(new LambdaQueryWrapper<EventLog>()
                .eq(EventLog::getMemberId, memberId)
                .ge(EventLog::getCreatedAt, since)
                .orderByDesc(EventLog::getCreatedAt)
                .last("LIMIT 100"));
        List<Map<String, Object>> result = new ArrayList<>();
        for (EventLog log : list) {
            Map<String, Object> m = new HashMap<>();
            m.put("eventType", log.getEventType());
            m.put("eventLabel", eventTypeLabel(log.getEventType()));
            m.put("targetType", log.getTargetType());
            m.put("targetId", log.getTargetId());
            m.put("title", resolveTargetTitle(log.getTargetType(), log.getTargetId()));
            m.put("createdAt", FormatUtils.formatDateTime(log.getCreatedAt()));
            m.put("route", buildRoute(log.getTargetType(), log.getTargetId()));
            result.add(m);
        }
        return result;
    }

    /** 徽章墙（已获/未获）；earned 以 member_badge 为唯一真源，查询前补授予未写入记录 */
    public List<Map<String, Object>> badges() {
        Long memberId = requireMemberId();
        badgeGrantService.checkAndGrant(memberId);

        List<Badge> all = badgeMapper.selectList(new LambdaQueryWrapper<Badge>()
                .eq(Badge::getStatus, 1)
                .orderByAsc(Badge::getId));
        Set<Long> earnedIds = new HashSet<>();
        Map<Long, LocalDateTime> achievedMap = new HashMap<>();
        memberBadgeMapper.selectList(new LambdaQueryWrapper<MemberBadge>()
                        .eq(MemberBadge::getMemberId, memberId))
                .forEach(mb -> {
                    earnedIds.add(mb.getBadgeId());
                    achievedMap.put(mb.getBadgeId(), mb.getAchievedAt());
                });

        List<Map<String, Object>> result = new ArrayList<>();
        for (Badge badge : all) {
            boolean earned = earnedIds.contains(badge.getId());
            Map<String, Object> m = new HashMap<>();
            m.put("id", badge.getId());
            m.put("name", badge.getName());
            m.put("description", badge.getDescription());
            m.put("iconUrl", badge.getIconUrl());
            m.put("earned", earned);
            m.put("achievedAt", earned && achievedMap.get(badge.getId()) != null
                    ? FormatUtils.formatDateTime(achievedMap.get(badge.getId())) : "");
            m.put("conditionText", badge.getDescription());
            result.add(m);
        }
        return result;
    }

    private Map<String, Object> resolveFavoriteItem(Favorite fav) {
        String title = resolveTargetTitle(fav.getTargetType(), fav.getTargetId());
        if (title == null || title.isBlank()) {
            return null;
        }
        Map<String, Object> m = new HashMap<>();
        m.put("id", fav.getId());
        m.put("targetType", fav.getTargetType());
        m.put("targetTypeLabel", targetTypeLabel(fav.getTargetType()));
        m.put("targetId", fav.getTargetId());
        m.put("title", title);
        m.put("createTime", FormatUtils.formatDateTime(fav.getCreateTime()));
        m.put("route", buildRoute(fav.getTargetType(), fav.getTargetId()));
        return m;
    }

    private String resolveTargetTitle(String targetType, Long targetId) {
        if (targetType == null || targetId == null) {
            return "";
        }
        return switch (targetType) {
            case "news" -> {
                News n = newsMapper.selectById(targetId);
                yield n != null ? n.getTitle() : "";
            }
            case "hall" -> {
                Hall h = hallMapper.selectById(targetId);
                yield h != null ? h.getName() : "";
            }
            case "craft" -> {
                Craft c = craftMapper.selectById(targetId);
                yield c != null ? c.getName() : "";
            }
            case "course" -> {
                Course c = courseMapper.selectById(targetId);
                yield c != null ? c.getName() : "";
            }
            case "resource" -> {
                Resource r = resourceMapper.selectById(targetId);
                yield r != null ? r.getName() : "";
            }
            case "activity" -> {
                Activity a = activityMapper.selectById(targetId);
                yield a != null ? a.getTitle() : "";
            }
            default -> "";
        };
    }

    private String buildRoute(String targetType, Long targetId) {
        if (targetType == null || targetId == null) {
            return "";
        }
        return switch (targetType) {
            case "news" -> "/packageA/news/detail?id=" + targetId;
            case "hall" -> "/packageA/hall/detail?id=" + targetId;
            case "craft" -> "/packageA/craft/detail?id=" + targetId;
            case "course" -> "/packageB/course/detail?id=" + targetId;
            case "resource" -> "/packageB/resource/list";
            case "activity" -> "/packageC/activity/detail?id=" + targetId;
            default -> "";
        };
    }

    private String targetTypeLabel(String type) {
        if (type == null) {
            return "";
        }
        return switch (type) {
            case "news" -> "动态";
            case "hall" -> "展馆";
            case "craft" -> "文创";
            case "course" -> "课程";
            case "resource" -> "资源";
            default -> type;
        };
    }

    private String eventTypeLabel(String type) {
        if (type == null) {
            return "";
        }
        return switch (type) {
            case "view" -> "浏览";
            case "like" -> "点赞";
            case "favorite" -> "收藏";
            case "share" -> "分享";
            case "download" -> "下载";
            case "enroll" -> "报名";
            case "play" -> "学习";
            default -> type;
        };
    }

    private Long requireMemberId() {
        Long memberId = MemberContext.getMemberId();
        if (memberId == null) {
            throw new BusinessException(401, "请先登录");
        }
        return memberId;
    }
}
