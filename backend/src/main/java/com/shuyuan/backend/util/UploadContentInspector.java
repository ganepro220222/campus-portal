package com.shuyuan.backend.util;

import com.shuyuan.backend.common.exception.BusinessException;

import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

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
            Map.entry("aac", "audio/aac"),
            Map.entry("wav", "audio/wav"),
            Map.entry("pdf", "application/pdf"),
            Map.entry("doc", "application/msword"),
            Map.entry("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
            Map.entry("ppt", "application/vnd.ms-powerpoint"),
            Map.entry("pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"),
            Map.entry("xls", "application/vnd.ms-excel"),
            Map.entry("xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
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

    /**
     * 直传完成后的播放兼容性门禁（不是转码）。
     * 扫描文件头/尾的 ISO BMFF box：H.265 直接拒绝；moov 只在尾部则给出 Fast Start 提示。
     */
    public static String inspectVideoPlayability(byte[] head, byte[] tail) {
        Set<String> headBoxes = collectIsoBoxTypes(head);
        Set<String> tailBoxes = collectIsoBoxTypes(tail);
        if (containsHevc(headBoxes) || containsHevc(tailBoxes) || ftypHasHevcBrand(head)) {
            throw new BusinessException(400,
                    "视频为 H.265/HEVC，部分手机无法播放。请转换为 H.264（AVC）的 MP4 后再上传");
        }
        if (!headBoxes.contains("moov") && tailBoxes.contains("moov")) {
            return "该视频未做 Fast Start（moov 在文件尾），小程序首次打开可能较慢。建议导出时勾选 faststart";
        }
        return "";
    }

    private static boolean containsHevc(Set<String> types) {
        return types.contains("hvc1") || types.contains("hev1") || types.contains("dvh1");
    }

    private static boolean ftypHasHevcBrand(byte[] head) {
        for (String brand : ftypBrands(head)) {
            if ("hvc1".equals(brand) || "hev1".equals(brand) || "dvh1".equals(brand)
                    || "heic".equals(brand) || "heim".equals(brand)) {
                return true;
            }
        }
        return false;
    }

    static Set<String> ftypBrands(byte[] data) {
        Set<String> brands = new HashSet<>();
        if (data == null || data.length < 16) {
            return brands;
        }
        if (!(data.length >= 8 && data[4] == 'f' && data[5] == 't' && data[6] == 'y' && data[7] == 'p')) {
            return brands;
        }
        int size = readInt32(data, 0);
        int end = size >= 16 ? Math.min(data.length, size) : data.length;
        brands.add(fourCc(data, 8));
        for (int i = 16; i + 4 <= end; i += 4) {
            brands.add(fourCc(data, i));
        }
        return brands;
    }

    static Set<String> collectIsoBoxTypes(byte[] data) {
        Set<String> types = new HashSet<>();
        if (data == null || data.length < 8) {
            return types;
        }
        for (int offset = 0; offset + 8 <= data.length; offset++) {
            if (!looksLikeBoxHeader(data, offset)) {
                continue;
            }
            String type = fourCc(data, offset + 4);
            types.add(type);
        }
        return types;
    }

    private static boolean looksLikeBoxHeader(byte[] data, int offset) {
        long size = readInt32(data, offset) & 0xFFFFFFFFL;
        if (size != 0 && (size < 8 || size > 64L * 1024 * 1024)) {
            return false;
        }
        String type = fourCc(data, offset + 4);
        if (type.length() != 4) {
            return false;
        }
        for (int i = 0; i < 4; i++) {
            char c = type.charAt(i);
            if (!(c >= 'a' && c <= 'z') && !(c >= '0' && c <= '9') && c != ' ') {
                return false;
            }
        }
        return true;
    }

    private static int readInt32(byte[] data, int offset) {
        return ((data[offset] & 0xFF) << 24)
                | ((data[offset + 1] & 0xFF) << 16)
                | ((data[offset + 2] & 0xFF) << 8)
                | (data[offset + 3] & 0xFF);
    }

    private static String fourCc(byte[] data, int offset) {
        if (offset + 4 > data.length) {
            return "";
        }
        return new String(data, offset, 4, StandardCharsets.US_ASCII);
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
            case "aac" -> isAdtsAac(h) || startsWith(h, 'A', 'D', 'I', 'F')
                    || (h.length >= 8 && h[4] == 'f' && h[5] == 't' && h[6] == 'y' && h[7] == 'p');
            case "wav" -> h.length >= 12 && startsWith(h, 'R', 'I', 'F', 'F')
                    && h[8] == 'W' && h[9] == 'A' && h[10] == 'V' && h[11] == 'E';
            case "doc", "ppt", "xls" -> startsWith(
                    h, 0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1);
            case "docx", "pptx", "xlsx" -> startsWith(h, 0x50, 0x4B, 0x03, 0x04);
            case "glb" -> h.length >= 4 && h[0] == 'g' && h[1] == 'l' && h[2] == 'T' && h[3] == 'F';
            case "gltf" -> looksLikeJson(h);
            case "vtt" -> looksLikeTextSubtitle(h, "WEBVTT");
            case "srt" -> looksLikeSrt(h);
            default -> false;
        };
    }

    /** ADTS：12 bit 同步字且 layer=00，避免把 MP3 帧当成 AAC。 */
    private static boolean isAdtsAac(byte[] h) {
        return h.length >= 2
                && (h[0] & 0xFF) == 0xFF
                && (h[1] & 0xF6) == 0xF0;
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
