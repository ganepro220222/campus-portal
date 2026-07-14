package com.shuyuan.backend.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.TaskExecutor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * 在 Spring 事务提交后异步执行副作用（如外部 HTTP、微信订阅消息）。
 *
 * <p>保证外部调用不在主事务 commit 之前执行，且通过线程池脱离请求线程，
 * 避免微信等慢响应拖慢报名/审核接口返回。
 */
@Component
public class AfterCommit {

    private static final Logger log = LoggerFactory.getLogger(AfterCommit.class);

    private final TaskExecutor executor;

    public AfterCommit(@Qualifier("afterCommitExecutor") TaskExecutor executor) {
        this.executor = executor;
    }

    public void run(Runnable task) {
        if (task == null) {
            return;
        }
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            submit(task);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                submit(task);
            }
        });
    }

    private void submit(Runnable task) {
        try {
            executor.execute(() -> safeRun(task));
        } catch (Exception e) {
            log.warn("[after-commit] failed to submit task: {}", e.getMessage(), e);
        }
    }

    private void safeRun(Runnable task) {
        try {
            task.run();
        } catch (Exception e) {
            log.warn("[after-commit] side effect failed: {}", e.getMessage(), e);
        }
    }
}
