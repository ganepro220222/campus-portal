package com.shuyuan.backend.asr;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * 将阿里云 ASR Result JSON 转为 WebVTT
 */
final class VttConverter {

    private VttConverter() {}

    static String fromAliyunResult(String resultJson) {
        if (resultJson == null || resultJson.isBlank()) {
            return "";
        }
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(resultJson);
            JsonNode sentences = root.path("Sentences");
            if (!sentences.isArray() || sentences.isEmpty()) {
                sentences = root.path("Result").path("Sentences");
            }
            if (!sentences.isArray() || sentences.isEmpty()) {
                return "";
            }
            StringBuilder sb = new StringBuilder("WEBVTT\n\n");
            for (JsonNode s : sentences) {
                long begin = s.path("BeginTime").asLong(s.path("begin_time").asLong(0));
                long end = s.path("EndTime").asLong(s.path("end_time").asLong(begin + 1000));
                String text = s.path("Text").asText(s.path("text").asText("")).trim();
                if (text.isEmpty()) {
                    continue;
                }
                sb.append(formatMs(begin)).append(" --> ").append(formatMs(end)).append('\n');
                sb.append(text).append("\n\n");
            }
            return sb.toString().trim() + "\n";
        } catch (Exception e) {
            return "";
        }
    }

    private static String formatMs(long ms) {
        long h = ms / 3_600_000;
        long m = (ms % 3_600_000) / 60_000;
        long s = (ms % 60_000) / 1000;
        long milli = ms % 1000;
        return String.format("%02d:%02d:%02d.%03d", h, m, s, milli);
    }
}
