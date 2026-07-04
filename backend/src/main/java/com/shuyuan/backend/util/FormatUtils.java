package com.shuyuan.backend.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;

public final class FormatUtils {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private FormatUtils() {}

    public static String formatDate(LocalDateTime time) {
        return time == null ? "" : time.format(DATE_FMT);
    }

    public static String formatDateTime(LocalDateTime time) {
        return time == null ? "" : time.format(DATETIME_FMT);
    }

    /** 解析前端传入的时间字符串 */
    public static LocalDateTime parseDateTime(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        String s = text.trim().replace('T', ' ');
        if (s.length() >= 16) {
            return LocalDateTime.parse(s.substring(0, 16), DATETIME_FMT);
        }
        return LocalDateTime.parse(s, DATE_FMT);
    }

    public static String formatCount(int count) {
        if (count >= 10000) {
            return String.format("%.1f万", count / 10000.0);
        }
        if (count >= 1000) {
            return String.format("%.1fk", count / 1000.0);
        }
        return String.valueOf(count);
    }

    public static List<String> splitParagraphs(String content) {
        if (content == null || content.isBlank()) {
            return List.of();
        }
        return Arrays.stream(content.split("\\n+"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    public static String firstChar(String text) {
        if (text == null || text.isEmpty()) {
            return "";
        }
        return text.substring(0, 1);
    }
}
