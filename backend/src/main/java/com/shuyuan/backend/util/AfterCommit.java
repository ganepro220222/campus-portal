package com.shuyuan.backend.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * 在 Spring 事务提交后执行副作用（如外部 HTTP、微信订阅消息）。
 *
 * <p>保证外部调用不在主事务 commit 之前执行，从而避免拉长主事务持有时间。
 * 回调仍在请求线程同步执行；若需完全脱离请求线程，应改用异步任务或 outbox。
 */
public final class AfterCommit {

    private static final Logger log = LoggerFactory.getLogger(AfterCommit.class);

    private AfterCommit() {}

    public static void run(Runnable task) {
        if (task == null) {
            return;
        }
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            safeRun(task);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                safeRun(task);
            }
        });
    }

    private static void safeRun(Runnable task) {
        try {
            task.run();
        } catch (Exception e) {
            log.warn("[after-commit] side effect failed: {}", e.getMessage(), e);
        }
    }
}
