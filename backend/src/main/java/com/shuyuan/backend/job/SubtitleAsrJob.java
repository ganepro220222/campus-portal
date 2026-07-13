package com.shuyuan.backend.job;

import com.shuyuan.backend.service.SubtitleAsrService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 轮询 ASR 字幕任务（processing → ready / failed）
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SubtitleAsrJob {

    private final SubtitleAsrService subtitleAsrService;

    @Scheduled(cron = "0 */2 * * * ?")
    public void poll() {
        try {
            subtitleAsrService.pollProcessingTasks();
        } catch (Exception e) {
            log.warn("字幕 ASR 轮询任务异常: {}", e.getMessage());
        }
    }
}
