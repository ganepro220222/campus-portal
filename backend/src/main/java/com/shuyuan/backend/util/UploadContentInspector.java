package com.shuyuan.backend.util;

import com.shuyuan.backend.common.exception.BusinessException;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Map;

/**
 * 上传文件魔数校验与服务端 Content-Type 推断（不信任客户端 multipart Content-Type）。
 */
public final class UploadContentInspector {

    private static final Map<String, String> EXT_CONTENT_TYPES = Map.ofEntries(
            Map.entry("jpg", "image/jpeg"),
            Map.entry("jpeg", "image/jpeg"),
            Map.entry("png", "image/png"),
            Map.entry("gif", "image/gif"),
            Map.entry("webp", "image/webp"),
            Map.entry("mp4", "video/mp4"),
            Map.entry("mov", "video/quicktime"),
            Map.entry("mp3", "audio/mpeg"),
            Map.entry("m4a", "audio/mp4"),
            Map.entry("wav", "audio/wav"),
            Map.entry("pdf", "application/pdf"),
            Map.entry("doc", "application/msword"),
            Map.entry("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
            Map.entry("ppt", "application/vnd.ms-powerpoint"),
            Map.entry("pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"),
            Map.entry("vtt", "text/vtt"),
            Map.entry("srt", "application/x-subrip"),
            Map.entry("glb", "model/gltf-binary"),
            Map.entry("gltf", "model/gltf+json")
    );

    private UploadContentInspector() {
    }

    public static String inspect(String ext, byte[] header) {
        if (header == null || header.length == 0) {
            throw new BusinessException(400, "无法识别文件内容");
        }
        String normalized = ext == null ? "" : ext.trim().toLowerCase(Locale.ROOT);
        if (!matchesMagic(normalized, header)) {
            throw new BusinessException(400, "文件内容与扩展名不匹配");
        }
        return EXT_CONTENT_TYPES.getOrDefault(normalized, "application/octet-stream");
    }

    private static boolean matchesMagic(String ext, byte[] h) {
        return switch (ext) {
            case "jpg", "jpeg" -> startsWith(h, (byte) 0xFF, (byte) 0xD8, (byte) 0xFF);
            case "png" -> startsWith(h, (byte) 0x89, 0x50, 0x4E, 0x47);
            case "gif" -> startsWith(h, 'G', 'I', 'F');
            case "webp" -> h.length >= 12 && startsWith(h, 'R', 'I', 'F', 'F')
                    && h[8] == 'W' && h[9] == 'E' && h[10] == 'B' && h[11] == 'P';
            case "pdf" -> startsWith(h, '%', 'P', 'D', 'F');
            case "mp4", "mov" -> h.length >= 8 && h[4] == 'f' && h[5] == 't' && h[6] == 'y' && h[7] == 'p';
            case "mp3" -> (h.length >= 3 && h[0] == 'I' && h[1] == 'D' && h[2] == '3')
                    || (h.length >= 2 && (h[0] & 0xFF) == 0xFF && ((h[1] & 0xE0) == 0xE0 || (h[1] & 0xF0) == 0xF0));
            case "m4a" -> h.length >= 8 && h[4] == 'f' && h[5] == 't' && h[6] == 'y' && h[7] == 'p';
            case "wav" -> h.length >= 12 && startsWith(h, 'R', 'I', 'F', 'F')
                    && h[8] == 'W' && h[9] == 'A' && h[10] == 'V' && h[11] == 'E';
            case "doc", "ppt" -> startsWith(h, (byte) 0xD0, (byte) 0xCF, 0x11, (byte) 0xE0);
            case "docx", "pptx" -> startsWith(h, 0x50, 0x4B, 0x03, 0x04);
            case "glb" -> h.length >= 4 && h[0] == 'g' && h[1] == 'l' && h[2] == 'T' && h[3] == 'F';
            case "gltf" -> looksLikeJson(h);
            case "vtt" -> looksLikeTextSubtitle(h, "WEBVTT");
            case "srt" -> looksLikeSrt(h);
            default -> false;
        };
    }

    private static boolean looksLikeJson(byte[] h) {
        for (byte b : h) {
            if (b == '{') {
                return true;
            }
            if (!Character.isWhitespace(b)) {
                break;
            }
        }
        return false;
    }

    private static boolean looksLikeTextSubtitle(byte[] h, String marker) {
        String prefix = new String(h, 0, Math.min(h.length, marker.length()), StandardCharsets.UTF_8);
        return prefix.startsWith(marker);
    }

    private static boolean looksLikeSrt(byte[] h) {
        String text = new String(h, 0, Math.min(h.length, 32), StandardCharsets.UTF_8).trim();
        return text.matches("^\\d+\\s*\\r?\\n\\d{2}:\\d{2}:\\d{2}.*");
    }

    private static boolean startsWith(byte[] data, int... bytes) {
        if (data.length < bytes.length) {
            return false;
        }
        for (int i = 0; i < bytes.length; i++) {
            if ((data[i] & 0xFF) != bytes[i]) {
                return false;
            }
        }
        return true;
    }

    private static boolean startsWith(byte[] data, byte b0, byte b1, byte b2) {
        return data.length >= 3 && data[0] == b0 && data[1] == b1 && data[2] == b2;
    }

    private static boolean startsWith(byte[] data, byte b0, byte b1, byte b2, byte b3) {
        return data.length >= 4 && data[0] == b0 && data[1] == b1 && data[2] == b2 && data[3] == b3;
    }

    private static boolean startsWith(byte[] data, char c0, char c1, char c2) {
        return data.length >= 3 && data[0] == c0 && data[1] == c1 && data[2] == c2;
    }

    private static boolean startsWith(byte[] data, char c0, char c1, char c2, char c3) {
        return data.length >= 4 && data[0] == c0 && data[1] == c1 && data[2] == c2 && data[3] == c3;
    }
}
