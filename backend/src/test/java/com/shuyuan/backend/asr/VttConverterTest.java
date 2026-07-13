package com.shuyuan.backend.asr;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class VttConverterTest {

    @Test
    void fromAliyunResult_buildsWebVtt() {
        String json = """
                {"Sentences":[{"BeginTime":0,"EndTime":1500,"Text":"你好"},{"BeginTime":1500,"EndTime":3000,"Text":"世界"}]}
                """;
        String vtt = VttConverter.fromAliyunResult(json);
        assertTrue(vtt.startsWith("WEBVTT"));
        assertTrue(vtt.contains("你好"));
        assertTrue(vtt.contains("世界"));
        assertTrue(vtt.contains("00:00:00.000 --> 00:00:01.500"));
    }

    @Test
    void fromAliyunResult_sanitizesCueArrowAndMarkup() {
        String json = """
                {"Sentences":[{"BeginTime":0,"EndTime":1000,"Text":"A --> B <script>alert(1)</script>"}]}
                """;
        String vtt = VttConverter.fromAliyunResult(json);
        assertTrue(vtt.contains("A — B"));
        assertTrue(vtt.contains("&lt;script&gt;"));
        assertFalse(vtt.contains("A --> B"));
    }

    @Test
    void fromAliyunResult_normalizesControlCharsAndNewlines() {
        String json = "{\"Sentences\":[{\"BeginTime\":0,\"EndTime\":1000,\"Text\":\"line1\\nline2\\u0007tail\"}]}";
        String vtt = VttConverter.fromAliyunResult(json);
        assertTrue(vtt.contains("line1 line2tail"));
        assertFalse(vtt.contains("\u0007"));
    }

    @Test
    void fromAliyunResult_truncatesOverlongCue() {
        String longText = "字".repeat(VttCueSanitizer.MAX_CUE_LENGTH + 50);
        String json = """
                {"Sentences":[{"BeginTime":0,"EndTime":1000,"Text":"%s"}]}
                """.formatted(longText);
        String vtt = VttConverter.fromAliyunResult(json);
        int cueStart = vtt.indexOf("字");
        String cueBody = vtt.substring(cueStart).trim();
        assertTrue(cueBody.length() <= VttCueSanitizer.MAX_CUE_LENGTH);
    }
}
