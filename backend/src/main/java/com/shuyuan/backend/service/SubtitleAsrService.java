package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
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
        Course update = new Course();
        update.setId(course.getId());
        if (result.state() == AsrJobState.FAILED) {
            update.setSubtitleStatus("failed");
            update.setSubtitleAsrLastError(truncateError(result.errorMessage()));
            courseMapper.updateById(update);
            return;
        }
        String vtt = result.vttContent();
        if (!StringUtils.hasText(vtt)) {
            update.setSubtitleStatus("failed");
            update.setSubtitleAsrLastError("ASR 结果为空");
            courseMapper.updateById(update);
            return;
        }
        var uploaded = ossService.uploadText("subtitle", "vtt", vtt, "text/vtt; charset=utf-8");
        update.setSubtitleUrl(uploaded.get("url"));
        update.setSubtitleStatus("ready");
        update.setSubtitleAsrLastError(null);
        courseMapper.updateById(update);
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
