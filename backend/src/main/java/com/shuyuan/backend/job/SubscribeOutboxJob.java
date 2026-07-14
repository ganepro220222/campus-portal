package com.shuyuan.backend.job;

import com.shuyuan.backend.service.SubscribeOutboxService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 轮询订阅消息发件箱并投递微信（pending → sent / skipped / failed）
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SubscribeOutboxJob {

    private final SubscribeOutboxService subscribeOutboxService;

    @Scheduled(cron = "0 */1 * * * ?")
    public void poll() {
        try {
            subscribeOutboxService.pollPending();
        } catch (Exception e) {
            log.warn("订阅消息发件箱轮询异常: {}", e.getMessage());
        }
    }
}
