package com.shuyuan.backend.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ContentSafetyServiceTest {

    private final ContentSafetyService service = new ContentSafetyService();

    @Test
    void allowsNormalQuestion() {
        assertTrue(service.checkText("什么是阳明文化？"));
    }

    @Test
    void blocksUnsafeKeyword() {
        assertFalse(service.checkText("这里涉及色情内容"));
    }
}
