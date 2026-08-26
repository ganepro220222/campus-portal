package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.shuyuan.backend.asr.AsrJobResult;
import com.shuyuan.backend.asr.AsrJobState;
import com.shuyuan.backend.config.ShuyuanProperties;
import com.shuyuan.backend.entity.Course;
import com.shuyuan.backend.mapper.CourseMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static com.shuyuan.backend.service.UpdateWrapperAssertions.assertSetsColumn;
import static com.shuyuan.backend.service.UpdateWrapperAssertions.initEntityCache;
import static com.shuyuan.backend.service.UpdateWrapperAssertions.updateCaptor;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubtitleAsrServiceTest {

    /** 字幕就绪要把 subtitle_asr_last_error 写成 NULL，走 LambdaUpdateWrapper，需实体缓存 */
    @BeforeAll
    static void initMybatisPlusEntityCache() {
        initEntityCache(Course.class);
    }

    @Mock
    private CourseMapper courseMapper;
    @Mock
    private AsrService asrService;
    @Mock
    private OssService ossService;
    @Mock
    private ShuyuanProperties shuyuanProperties;

    @InjectMocks
    private SubtitleAsrService subtitleAsrService;

    private ShuyuanProperties.Asr asrConfig;

    @BeforeEach
    void setUp() {
        asrConfig = new ShuyuanProperties.Asr();
        asrConfig.setPollBatchSize(50);
        asrConfig.setPollTimeoutHours(24);
        lenient().when(shuyuanProperties.getAsr()).thenReturn(asrConfig);
        lenient().when(asrService.isConfigured()).thenReturn(true);
    }

    @Test
    void pollProcessingTasks_excludesStubTasksAtQueryLevel() {
        when(courseMapper.selectList(any())).thenReturn(List.of());

        subtitleAsrService.pollProcessingTasks();

        verify(asrService, never()).query(any());
    }

    @Test
    void pollProcessingTasks_marksTimedOutAsFailed() {
        Course course = processingCourse(2L, "task-old");
        course.setSubtitleAsrStartedAt(LocalDateTime.now().minusHours(30));
        when(courseMapper.selectList(any())).thenReturn(List.of(course));

        subtitleAsrService.pollProcessingTasks();

        verify(courseMapper).updateById(argThat((Course u) ->
                u.getId().equals(2L)
                        && "failed".equals(u.getSubtitleStatus())
                        && u.getSubtitleAsrLastError() != null
                        && u.getSubtitleAsrLastError().contains("超时")));
        verify(asrService, never()).query("task-old");
    }

    @Test
    void pollProcessingTasks_recordsAttemptOnProcessing() {
        Course course = processingCourse(3L, "task-run");
        course.setSubtitleAsrAttemptCount(0);
        when(courseMapper.selectList(any())).thenReturn(List.of(course));
        when(courseMapper.selectById(3L)).thenReturn(course);
        when(asrService.query("task-run")).thenReturn(AsrJobResult.processing());

        subtitleAsrService.pollProcessingTasks();

        verify(courseMapper, atLeastOnce()).updateById(argThat((Course u) ->
                u.getId().equals(3L)
                        && u.getSubtitleAsrLastPollAt() != null
                        && u.getSubtitleAsrAttemptCount() != null
                        && u.getSubtitleAsrAttemptCount() == 1));
    }

    @Test
    void pollProcessingTasks_excludesBackoffTasksAtQueryLevel() {
        when(courseMapper.selectList(any())).thenReturn(List.of());

        subtitleAsrService.pollProcessingTasks();

        verify(asrService, never()).query(any());
    }

    @Test
    void pollProcessingTasks_continuesAfterSingleFailure() {
        Course ok = processingCourse(5L, "task-ok");
        Course bad = processingCourse(6L, "task-bad");
        when(courseMapper.selectList(any())).thenReturn(List.of(bad, ok));
        when(courseMapper.selectById(6L)).thenReturn(bad);
        when(courseMapper.selectById(5L)).thenReturn(ok);
        when(asrService.query("task-bad")).thenThrow(new RuntimeException("upstream down"));
        when(asrService.query("task-ok")).thenReturn(AsrJobResult.success("WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nhi\n"));
        when(ossService.uploadText(eq("subtitle"), eq("vtt"), any(), any()))
                .thenReturn(Map.of("url", "subtitles/a.vtt"));

        subtitleAsrService.pollProcessingTasks();

        verify(asrService).query("task-bad");
        verify(asrService).query("task-ok");
        ArgumentCaptor<LambdaUpdateWrapper<Course>> cap = updateCaptor();
        verify(courseMapper).update(isNull(), cap.capture());
        assertSetsColumn(cap.getValue(), "subtitle_status", "ready");
        assertSetsColumn(cap.getValue(), "subtitle_url", "subtitles/a.vtt");
        // 就绪时必须抹掉上一轮的失败原因，否则「已就绪」还挂着旧报错
        assertSetsColumn(cap.getValue(), "subtitle_asr_last_error", null);
    }

    @Test
    void asrPollConfig_hasSafeDefaults() {
        assertEquals(50, asrConfig.getPollBatchSize());
        assertEquals(24, asrConfig.getPollTimeoutHours());
    }

    private static Course processingCourse(Long id, String taskId) {
        Course course = new Course();
        course.setId(id);
        course.setSubtitleStatus("processing");
        course.setSubtitleTaskId(taskId);
        course.setSubtitleAsrStartedAt(LocalDateTime.now());
        return course;
    }
}
