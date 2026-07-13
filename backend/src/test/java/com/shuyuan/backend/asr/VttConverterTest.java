package com.shuyuan.backend.asr;

import org.junit.jupiter.api.Test;

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
}
