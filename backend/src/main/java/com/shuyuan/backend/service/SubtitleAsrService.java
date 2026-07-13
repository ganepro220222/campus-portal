package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.asr.AsrJobResult;
import com.shuyuan.backend.asr.AsrJobState;
import com.shuyuan.backend.entity.Course;
import com.shuyuan.backend.mapper.CourseMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubtitleAsrService {

    private final CourseMapper courseMapper;
    private final AsrService asrService;
    private final OssService ossService;

    public void pollProcessingTasks() {
        if (!asrService.isConfigured()) {
            return;
        }
        List<Course> tasks = courseMapper.selectList(new LambdaQueryWrapper<Course>()
                .eq(Course::getSubtitleStatus, "processing")
                .isNotNull(Course::getSubtitleTaskId)
                .ne(Course::getSubtitleTaskId, ""));
        for (Course course : tasks) {
            if (course.getSubtitleTaskId() != null && course.getSubtitleTaskId().startsWith("stub-")) {
                continue;
            }
            try {
                handleOne(course);
            } catch (Exception e) {
                log.warn("[subtitle-asr] 轮询课程 {} 失败: {}", course.getId(), e.getMessage());
            }
        }
    }

    @Transactional
    protected void handleOne(Course course) {
        AsrJobResult result = asrService.query(course.getSubtitleTaskId());
        if (result.state() == AsrJobState.PROCESSING) {
            return;
        }
        Course update = new Course();
        update.setId(course.getId());
        if (result.state() == AsrJobState.FAILED) {
            update.setSubtitleStatus("failed");
            courseMapper.updateById(update);
            return;
        }
        String vtt = result.vttContent();
        if (!StringUtils.hasText(vtt)) {
            update.setSubtitleStatus("failed");
            courseMapper.updateById(update);
            return;
        }
        var uploaded = ossService.uploadText("subtitle", "vtt", vtt, "text/vtt; charset=utf-8");
        update.setSubtitleUrl(uploaded.get("url"));
        update.setSubtitleStatus("ready");
        courseMapper.updateById(update);
        log.info("[subtitle-asr] 课程 {} 字幕已就绪", course.getId());
    }
}
