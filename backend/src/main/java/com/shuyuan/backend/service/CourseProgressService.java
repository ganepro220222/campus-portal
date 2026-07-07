package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.CourseProgressRequest;
import com.shuyuan.backend.entity.Course;
import com.shuyuan.backend.entity.CourseProgress;
import com.shuyuan.backend.mapper.CourseMapper;
import com.shuyuan.backend.mapper.CourseProgressMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 课程学习进度：续播、完成判定与积分触发（验收 §2.6、详细方案 Phase 3）
 */
@Service
@RequiredArgsConstructor
public class CourseProgressService {

    private static final BigDecimal COMPLETE_THRESHOLD = new BigDecimal("90.00");

    private final CourseProgressMapper courseProgressMapper;
    private final CourseMapper courseMapper;
    private final PointService pointService;
    private final EventLogService eventLogService;

    public Map<String, Object> getProgress(Long courseId) {
        requirePublishedCourse(courseId);
        Long memberId = MemberContext.getMemberId();
        if (memberId == null) {
            return emptyProgress(courseId);
        }
        CourseProgress progress = findProgress(memberId, courseId);
        if (progress == null) {
            return emptyProgress(courseId);
        }
        return toVo(progress);
    }

    @Transactional
    public Map<String, Object> reportProgress(Long courseId, CourseProgressRequest req) {
        Long memberId = requireMemberId();
        requirePublishedCourse(courseId);

        int position = req.getLastPositionSeconds();
        int total = req.getTotalDurationSeconds() != null && req.getTotalDurationSeconds() > 0
                ? req.getTotalDurationSeconds()
                : 0;
        BigDecimal percent = calcPercent(position, total);
        boolean completedNow = percent.compareTo(COMPLETE_THRESHOLD) >= 0;

        CourseProgress existing = findProgress(memberId, courseId);
        boolean wasCompleted = existing != null && existing.getCompleted() != null && existing.getCompleted() == 1;

        CourseProgress row = existing != null ? existing : new CourseProgress();
        row.setMemberId(memberId);
        row.setCourseId(courseId);
        row.setLastPositionSeconds(position);
        row.setTotalDurationSeconds(total);
        row.setProgressPercent(percent);
        row.setCompleted(completedNow ? 1 : 0);
        row.setUpdatedAt(LocalDateTime.now());

        if (existing == null) {
            courseProgressMapper.insert(row);
        } else {
            courseProgressMapper.updateById(row);
        }

        if (completedNow && !wasCompleted) {
            pointService.award(memberId, "complete_course");
            eventLogService.record("complete", "course", courseId);
        }

        return toVo(row);
    }

    private CourseProgress findProgress(Long memberId, Long courseId) {
        return courseProgressMapper.selectOne(new LambdaQueryWrapper<CourseProgress>()
                .eq(CourseProgress::getMemberId, memberId)
                .eq(CourseProgress::getCourseId, courseId)
                .last("LIMIT 1"));
    }

    private void requirePublishedCourse(Long courseId) {
        Course course = courseMapper.selectById(courseId);
        if (course == null || course.getStatus() == null || course.getStatus() != 1) {
            throw new BusinessException(404, "课程不存在");
        }
    }

    private Long requireMemberId() {
        Long memberId = MemberContext.getMemberId();
        if (memberId == null) {
            throw new BusinessException(401, "请先登录");
        }
        return memberId;
    }

    private BigDecimal calcPercent(int position, int total) {
        if (total <= 0) {
            return BigDecimal.ZERO;
        }
        double raw = Math.min(100.0, position * 100.0 / total);
        return BigDecimal.valueOf(raw).setScale(2, RoundingMode.HALF_UP);
    }

    private Map<String, Object> emptyProgress(Long courseId) {
        Map<String, Object> m = new HashMap<>();
        m.put("courseId", courseId);
        m.put("lastPositionSeconds", 0);
        m.put("totalDurationSeconds", 0);
        m.put("progressPercent", BigDecimal.ZERO);
        m.put("completed", false);
        return m;
    }

    private Map<String, Object> toVo(CourseProgress p) {
        Map<String, Object> m = new HashMap<>();
        m.put("courseId", p.getCourseId());
        m.put("lastPositionSeconds", p.getLastPositionSeconds() != null ? p.getLastPositionSeconds() : 0);
        m.put("totalDurationSeconds", p.getTotalDurationSeconds() != null ? p.getTotalDurationSeconds() : 0);
        m.put("progressPercent", p.getProgressPercent() != null ? p.getProgressPercent() : BigDecimal.ZERO);
        m.put("completed", p.getCompleted() != null && p.getCompleted() == 1);
        return m;
    }
}
