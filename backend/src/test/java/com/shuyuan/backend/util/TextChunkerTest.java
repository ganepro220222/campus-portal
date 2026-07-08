package com.shuyuan.backend.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class TextChunkerTest {

    @Test
    void split_producesMultipleChunks() {
        String text = "阳".repeat(600);
        var parts = TextChunker.split(text);
        assertTrue(parts.size() >= 2);
    }
}
