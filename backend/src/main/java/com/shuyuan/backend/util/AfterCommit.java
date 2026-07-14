package com.shuyuan.backend.util;

import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * 在 Spring 事务提交后执行副作用（如外部 HTTP、微信订阅消息），避免拉长主事务。
 */
public final class AfterCommit {

    private AfterCommit() {}

    public static void run(Runnable task) {
        if (task == null) {
            return;
        }
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            task.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                task.run();
            }
        });
    }
}
