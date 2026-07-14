package com.shuyuan.backend.util;

import java.util.ArrayList;
import java.util.List;

/** 知识库文本切分（500 字/段，50 字重叠） */
public final class TextChunker {

    private static final int CHUNK_SIZE = 500;
    private static final int OVERLAP = 50;

    private TextChunker() {}

    public static List<String> split(String text) {
        if (text == null || text.isBlank()) {
            return List.of();
        }
        String normalized = text.replace("\r\n", "\n").trim();
        List<String> chunks = new ArrayList<>();
        int start = 0;
        while (start < normalized.length()) {
            int end = Math.min(start + CHUNK_SIZE, normalized.length());
            chunks.add(normalized.substring(start, end).trim());
            if (end >= normalized.length()) {
                break;
            }
            start = Math.max(0, end - OVERLAP);
        }
        return chunks.stream().filter(s -> !s.isBlank()).toList();
    }

    /**
     * 由分段近似还原原文（去掉相邻段的重叠部分）。
     * 仅用于旧数据（无 content 列）编辑回填的兜底，非字节级精确。
     */
    public static String join(List<String> chunks) {
        if (chunks == null || chunks.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder(chunks.get(0));
        for (int i = 1; i < chunks.size(); i++) {
            String c = chunks.get(i);
            int strip = Math.min(OVERLAP, c.length());
            sb.append(c.substring(strip));
        }
        return sb.toString();
    }
}
