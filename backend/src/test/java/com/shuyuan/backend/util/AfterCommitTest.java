package com.shuyuan.backend.util;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AfterCommitTest {

    private AfterCommit syncAfterCommit() {
        return new AfterCommit(Runnable::run);
    }

    @AfterEach
    void clear() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clear();
        }
    }

    @Test
    void run_executesImmediatelyWithoutActiveTransaction() {
        AtomicBoolean ran = new AtomicBoolean(false);
        syncAfterCommit().run(() -> ran.set(true));
        assertTrue(ran.get());
    }

    @Test
    void run_defersUntilAfterCommit() {
        TransactionSynchronizationManager.initSynchronization();
        AtomicBoolean ran = new AtomicBoolean(false);
        syncAfterCommit().run(() -> ran.set(true));
        assertFalse(ran.get());
        for (TransactionSynchronization sync : TransactionSynchronizationManager.getSynchronizations()) {
            sync.afterCommit();
        }
        assertTrue(ran.get());
    }

    @Test
    void run_skipsWhenTransactionRollsBack() {
        TransactionSynchronizationManager.initSynchronization();
        AtomicBoolean ran = new AtomicBoolean(false);
        syncAfterCommit().run(() -> ran.set(true));
        for (TransactionSynchronization sync : TransactionSynchronizationManager.getSynchronizations()) {
            sync.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK);
        }
        assertFalse(ran.get());
    }

    @Test
    void run_swallowsExceptionWithoutPropagating() {
        assertDoesNotThrow(() -> syncAfterCommit().run(() -> {
            throw new RuntimeException("boom");
        }));
    }

    @Test
    void run_submitsAsyncWithoutBlockingCallerAfterCommit() throws Exception {
        BlockingQueue<Runnable> queue = new ArrayBlockingQueue<>(1);
        AfterCommit afterCommit = new AfterCommit(queue::add);
        AtomicBoolean ran = new AtomicBoolean(false);

        TransactionSynchronizationManager.initSynchronization();
        try {
            afterCommit.run(() -> ran.set(true));
            for (TransactionSynchronization sync : TransactionSynchronizationManager.getSynchronizations()) {
                sync.afterCommit();
            }
            assertFalse(ran.get(), "task must not run on caller thread during afterCommit");
            assertEquals(1, queue.size(), "task should be submitted to executor");
            queue.poll().run();
            assertTrue(ran.get());
        } finally {
            TransactionSynchronizationManager.clear();
        }
    }
}
