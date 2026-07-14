package com.shuyuan.backend.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

/**
 * 事务提交后副作用线程池：微信订阅等外部 HTTP 不占用请求线程。
 */
@Slf4j
@Configuration
public class AfterCommitConfig {

    @Bean(name = "afterCommitExecutor")
    public TaskExecutor afterCommitExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(128);
        executor.setThreadNamePrefix("after-commit-");
        executor.setRejectedExecutionHandler((runnable, pool) ->
                log.warn("[after-commit] task rejected, queue full (active={}, queue={})",
                        pool.getActiveCount(), pool.getQueue().size()));
        executor.initialize();
        return executor;
    }
}
