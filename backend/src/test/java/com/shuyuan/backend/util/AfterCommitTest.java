package com.shuyuan.backend.util;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AfterCommitTest {

    @AfterEach
    void clear() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clear();
        }
    }

    @Test
    void run_executesImmediatelyWithoutActiveTransaction() {
        AtomicBoolean ran = new AtomicBoolean(false);
        AfterCommit.run(() -> ran.set(true));
        assertTrue(ran.get());
    }

    @Test
    void run_defersUntilAfterCommit() {
        TransactionSynchronizationManager.initSynchronization();
        AtomicBoolean ran = new AtomicBoolean(false);
        AfterCommit.run(() -> ran.set(true));
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
        AfterCommit.run(() -> ran.set(true));
        for (TransactionSynchronization sync : TransactionSynchronizationManager.getSynchronizations()) {
            sync.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK);
        }
        assertFalse(ran.get());
    }

    @Test
    void run_swallowsExceptionWithoutPropagating() {
        assertDoesNotThrow(() -> AfterCommit.run(() -> {
            throw new RuntimeException("boom");
        }));
    }
}
