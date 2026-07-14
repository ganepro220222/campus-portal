package com.shuyuan.backend.util;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TextChunkerTest {

    @Test
    void split_producesMultipleChunks() {
        String text = "阳".repeat(600);
        var parts = TextChunker.split(text);
        assertTrue(parts.size() >= 2);
    }

    @Test
    void split_returnsEmptyForBlank() {
        assertTrue(TextChunker.split(null).isEmpty());
        assertTrue(TextChunker.split("   ").isEmpty());
    }

    @Test
    void join_reconstructsOverlappingChunks() {
        String original = "段".repeat(600);
        List<String> parts = TextChunker.split(original);
        assertTrue(parts.size() >= 2);

        String joined = TextChunker.join(parts);
        assertTrue(joined.length() >= original.length() - 100,
                "join 应近似还原原文（允许重叠裁剪误差）");
        assertEquals(parts.get(0), joined.substring(0, parts.get(0).length()));
    }

    @Test
    void join_returnsEmptyForEmptyInput() {
        assertEquals("", TextChunker.join(List.of()));
        assertEquals("", TextChunker.join(null));
    }

    @Test
    void join_singleChunkReturnsAsIs() {
        assertEquals("唯一一段", TextChunker.join(List.of("唯一一段")));
    }
}
