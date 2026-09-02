package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.shuyuan.backend.asr.AsrJobResult;
import com.shuyuan.backend.asr.AsrJobState;
import com.shuyuan.backend.asr.SubtitleAsrPollPolicy;
import com.shuyuan.backend.config.ShuyuanProperties;
import com.shuyuan.backend.entity.Course;
import com.shuyuan.backend.mapper.CourseMapper;
import com.shuyuan.backend.util.OssManagedObjectKey;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
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
                markFailed(course.getId(), course.getSubtitleTaskId(), "ASR 任务超时");
                continue;
            }
            try {
                handleOne(course);
            } catch (Exception e) {
                log.warn("[subtitle-asr] 轮询课程 {} 失败: {}", course.getId(), e.getMessage());
                markPollError(course.getId(), course.getSubtitleTaskId(), truncateError(e.getMessage()));
            }
        }
    }

    protected void handleOne(Course course) {
        String taskId = course.getSubtitleTaskId();
        if (!recordPollAttempt(course.getId(), taskId)) {
            log.info("[subtitle-asr] 忽略已取消或已替换的任务 courseId={} taskId={}", course.getId(), taskId);
            return;
        }
        AsrJobResult result = asrService.query(taskId);
        if (result.state() == AsrJobState.PROCESSING) {
            return;
        }
        if (result.state() == AsrJobState.FAILED) {
            markFailed(course.getId(), taskId, result.errorMessage());
            return;
        }
        String vtt = result.vttContent();
        if (!StringUtils.hasText(vtt)) {
            markFailed(course.getId(), taskId, "ASR 结果为空");
            return;
        }
        var uploaded = ossService.uploadText("subtitle", "vtt", vtt, "text/vtt; charset=utf-8");
        String newUrl = uploaded.get("url");
        // 就绪时要抹掉上一轮的失败原因；updateById 跳过 null 字段，只能显式 set
        int updated = courseMapper.update(null, currentTaskUpdate(course.getId(), taskId)
                .set(Course::getSubtitleUrl, newUrl)
                .set(Course::getSubtitleStatus, "ready")
                .set(Course::getSubtitleAsrLastError, null));
        if (updated == 0) {
            String orphanKey = OssManagedObjectKey.extractManaged(newUrl);
            ossMediaCleanupService.deleteIfUnreferenced(orphanKey);
            log.info("[subtitle-asr] 丢弃晚到结果 courseId={} taskId={}", course.getId(), taskId);
            return;
        }
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

    private boolean recordPollAttempt(Long courseId, String taskId) {
        return courseMapper.update(null, currentTaskUpdate(courseId, taskId)
                .set(Course::getSubtitleAsrLastPollAt, LocalDateTime.now())
                .setSql("subtitle_asr_attempt_count = COALESCE(subtitle_asr_attempt_count, 0) + 1")) > 0;
    }

    private void markFailed(Long courseId, String taskId, String error) {
        courseMapper.update(null, currentTaskUpdate(courseId, taskId)
                .set(Course::getSubtitleStatus, "failed")
                .set(Course::getSubtitleAsrLastError, truncateError(error)));
    }

    private void markPollError(Long courseId, String taskId, String error) {
        courseMapper.update(null, currentTaskUpdate(courseId, taskId)
                .set(Course::getSubtitleAsrLastError, truncateError(error)));
    }

    private LambdaUpdateWrapper<Course> currentTaskUpdate(Long courseId, String taskId) {
        return new LambdaUpdateWrapper<Course>()
                .eq(Course::getId, courseId)
                .eq(Course::getSubtitleTaskId, taskId)
                .eq(Course::getSubtitleStatus, "processing");
    }

    private static String truncateError(String message) {
        if (!StringUtils.hasText(message)) {
            return "ASR 轮询异常";
        }
        String trimmed = message.trim();
        return trimmed.length() > 480 ? trimmed.substring(0, 480) : trimmed;
    }
}
