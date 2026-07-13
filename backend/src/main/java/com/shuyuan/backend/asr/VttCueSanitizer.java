package com.shuyuan.backend.asr;

/**
 * WebVTT cue 文本最小安全化，避免格式注入与解析错位。
 */
public final class VttCueSanitizer {

    static final int MAX_CUE_LENGTH = 500;

    private VttCueSanitizer() {}

    static String sanitize(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }
        String s = text.trim();
        s = s.replace("-->", "—");
        s = s.replace('\r', ' ').replace('\n', ' ');
        s = removeControlChars(s);
        s = escapeMarkup(s);
        s = collapseSpaces(s);
        if (s.length() > MAX_CUE_LENGTH) {
            s = s.substring(0, MAX_CUE_LENGTH);
        }
        return s.trim();
    }

    private static String removeControlChars(String s) {
        StringBuilder sb = new StringBuilder(s.length());
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '\t' || c >= 0x20) {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    private static String escapeMarkup(String s) {
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }

    private static String collapseSpaces(String s) {
        return s.replaceAll(" +", " ");
    }
}
