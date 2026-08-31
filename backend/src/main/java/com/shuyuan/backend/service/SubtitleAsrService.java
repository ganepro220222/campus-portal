package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.shuyuan.backend.asr.AsrJobResult;
import com.shuyuan.backend.asr.AsrJobState;
import com.shuyuan.backend.asr.SubtitleAsrPollPolicy;
import com.shuyuan.backend.config.ShuyuanProperties;
import com.shuyuan.backend.entity.Course;
import com.shuyuan.backend.mapper.CourseMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubtitleAsrService {

    private final CourseMapper courseMapper;
    private final AsrService asrService;
    private final OssService ossService;
    private final ShuyuanProperties shuyuanProperties;
    private final OssMediaCleanupService ossMediaCleanupService;

    public void pollProcessingTasks() {
        if (!asrService.isConfigured()) {
            return;
        }
        int batchSize = Math.max(1, shuyuanProperties.getAsr().getPollBatchSize());
        int timeoutHours = Math.max(1, shuyuanProperties.getAsr().getPollTimeoutHours());
        List<Course> tasks = courseMapper.selectList(new LambdaQueryWrapper<Course>()
                .eq(Course::getSubtitleStatus, "processing")
                .isNotNull(Course::getSubtitleTaskId)
                .ne(Course::getSubtitleTaskId, "")
                .notLikeRight(Course::getSubtitleTaskId, "stub-")
                .and(w -> w.apply(SubtitleAsrPollPolicy.pollDueCondition())
                        .or()
                        .apply(SubtitleAsrPollPolicy.timedOutCondition(timeoutHours)))
                .orderByAsc(Course::getSubtitleAsrLastPollAt)
                .last("LIMIT " + batchSize));
        for (Course course : tasks) {
            if (isTimedOut(course)) {
                markFailed(course.getId(), "ASR 任务超时");
                continue;
            }
            try {
                handleOne(course);
            } catch (Exception e) {
                log.warn("[subtitle-asr] 轮询课程 {} 失败: {}", course.getId(), e.getMessage());
                markPollError(course.getId(), truncateError(e.getMessage()));
            }
        }
    }

    @Transactional
    protected void handleOne(Course course) {
        recordPollAttempt(course.getId());
        AsrJobResult result = asrService.query(course.getSubtitleTaskId());
        if (result.state() == AsrJobState.PROCESSING) {
            return;
        }
        if (result.state() == AsrJobState.FAILED) {
            markFailed(course.getId(), result.errorMessage());
            return;
        }
        String vtt = result.vttContent();
        if (!StringUtils.hasText(vtt)) {
            markFailed(course.getId(), "ASR 结果为空");
            return;
        }
        var uploaded = ossService.uploadText("subtitle", "vtt", vtt, "text/vtt; charset=utf-8");
        String newUrl = uploaded.get("url");
        // 就绪时要抹掉上一轮的失败原因；updateById 跳过 null 字段，只能显式 set
        courseMapper.update(null, new LambdaUpdateWrapper<Course>()
                .eq(Course::getId, course.getId())
                .set(Course::getSubtitleUrl, newUrl)
                .set(Course::getSubtitleStatus, "ready")
                .set(Course::getSubtitleAsrLastError, null));
        ossMediaCleanupService.afterReplace(course.getSubtitleUrl(), newUrl);
        log.info("[subtitle-asr] 课程 {} 字幕已就绪", course.getId());
    }

    private boolean isTimedOut(Course course) {
        int hours = Math.max(1, shuyuanProperties.getAsr().getPollTimeoutHours());
        LocalDateTime started = course.getSubtitleAsrStartedAt();
        if (started == null) {
            started = course.getUpdateTime();
        }
        if (started == null) {
            return false;
        }
        return started.isBefore(LocalDateTime.now().minusHours(hours));
    }

    private void recordPollAttempt(Long courseId) {
        Course current = courseMapper.selectById(courseId);
        if (current == null) {
            return;
        }
        Course update = new Course();
        update.setId(courseId);
        update.setSubtitleAsrLastPollAt(LocalDateTime.now());
        int prev = current.getSubtitleAsrAttemptCount() != null ? current.getSubtitleAsrAttemptCount() : 0;
        update.setSubtitleAsrAttemptCount(prev + 1);
        courseMapper.updateById(update);
    }

    private void markFailed(Long courseId, String error) {
        Course update = new Course();
        update.setId(courseId);
        update.setSubtitleStatus("failed");
        update.setSubtitleAsrLastError(truncateError(error));
        courseMapper.updateById(update);
    }

    private void markPollError(Long courseId, String error) {
        Course update = new Course();
        update.setId(courseId);
        update.setSubtitleAsrLastError(truncateError(error));
        courseMapper.updateById(update);
    }

    private static String truncateError(String message) {
        if (!StringUtils.hasText(message)) {
            return "ASR 轮询异常";
        }
        String trimmed = message.trim();
        return trimmed.length() > 480 ? trimmed.substring(0, 480) : trimmed;
    }
}
