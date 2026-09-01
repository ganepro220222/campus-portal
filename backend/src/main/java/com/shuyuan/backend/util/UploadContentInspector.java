package com.shuyuan.backend.util;

import com.shuyuan.backend.common.exception.BusinessException;

import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * 上传文件魔数校验与服务端 Content-Type 推断（不信任客户端 multipart Content-Type）。
 */
public final class UploadContentInspector {

    public interface IsoByteSource {
        long size();

        byte[] read(long offset, int length) throws IOException;
    }

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

    private static final String HEVC_MESSAGE =
            "视频为 H.265/HEVC，部分手机无法播放。请转换为 H.264（AVC）的 MP4 后再上传";
    private static final String FAST_START_WARNING =
            "该视频未做 Fast Start（moov 在文件尾），小程序首次打开可能较慢。建议导出时勾选 faststart";
    private static final Set<String> HEVC_TYPES = Set.of("hvc1", "hev1", "dvh1", "dvhe", "hvcC");
    private static final Set<String> HEVC_BRANDS = Set.of("hvc1", "hev1", "dvh1", "heic", "heim", "hevc");
    private static final Set<String> CONTAINER_BOXES = Set.of(
            "moov", "trak", "mdia", "minf", "stbl", "edts", "moof", "traf", "mvex");
    private static final long MAX_BUFFERED_MOOV = 8L * 1024 * 1024;
    private static final int MAX_BOXES = 10_000;
    private static final int MAX_DEPTH = 40;

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
     * 播放兼容性门禁（不是转码）：按 ISO BMFF box 大小跳转，读取完整 moov。
     * H.265 直接拒绝；moov 在 mdat 之后则给出 Fast Start 提示。
     */
    public static String inspectVideoPlayability(byte[] file) {
        return inspectVideoPlayability(ofBytes(file == null ? new byte[0] : file));
    }

    /**
     * 仅有头尾切片时的兼容入口。不能代替对完整文件或 Range 源的解析。
     */
    public static String inspectVideoPlayability(byte[] head, byte[] tail) {
        if (tail == null || tail.length == 0) {
            return inspectVideoPlayability(head == null ? new byte[0] : head);
        }
        try {
            ScanState headState = scan(ofBytes(head == null ? new byte[0] : head));
            ScanState tailState = scan(ofBytes(tail));
            if (headState.hevc || tailState.hevc) {
                throw new BusinessException(400, HEVC_MESSAGE);
            }
            if (!headState.hasMoov() && tailState.hasMoov()) {
                return FAST_START_WARNING;
            }
            return "";
        } catch (IOException e) {
            throw new BusinessException(400, "无法校验文件内容");
        }
    }

    public static String inspectVideoPlayability(Path path) {
        if (path == null || !Files.isRegularFile(path)) {
            throw new BusinessException(400, "无法校验文件内容");
        }
        try (RandomAccessFile raf = new RandomAccessFile(path.toFile(), "r")) {
            return inspectVideoPlayability(new RafIsoSource(raf));
        } catch (BusinessException e) {
            throw e;
        } catch (IOException e) {
            throw new BusinessException(400, "无法校验文件内容");
        }
    }

    public static String inspectVideoPlayability(IsoByteSource source) {
        ScanState state;
        try {
            state = scan(source == null ? ofBytes(new byte[0]) : source);
        } catch (BusinessException e) {
            throw e;
        } catch (IOException e) {
            throw new BusinessException(400, "无法校验文件内容");
        }
        if (state.hevc) {
            throw new BusinessException(400, HEVC_MESSAGE);
        }
        if (state.hasMoov() && state.hasMdat() && state.moovOffset > state.mdatOffset) {
            return FAST_START_WARNING;
        }
        return "";
    }

    static IsoByteSource ofBytes(byte[] data) {
        byte[] bytes = data == null ? new byte[0] : data;
        return new IsoByteSource() {
            @Override
            public long size() {
                return bytes.length;
            }

            @Override
            public byte[] read(long offset, int length) {
                if (offset < 0 || offset >= bytes.length || length <= 0) {
                    return new byte[0];
                }
                int start = (int) offset;
                int want = Math.min(length, bytes.length - start);
                return Arrays.copyOfRange(bytes, start, start + want);
            }
        };
    }

    private static ScanState scan(IsoByteSource source) throws IOException {
        ScanState state = new ScanState();
        long size = source.size();
        if (size < 8) {
            return state;
        }
        walk(source, 0, size, 0, true, state);
        return state;
    }

    private static void walk(
            IsoByteSource source,
            long start,
            long limit,
            int depth,
            boolean topLevel,
            ScanState state) throws IOException {
        if (depth > MAX_DEPTH || state.boxes > MAX_BOXES || start + 8 > limit) {
            return;
        }
        long offset = start;
        while (offset + 8 <= limit && state.boxes <= MAX_BOXES && !state.hevc) {
            BoxHeader box = readHeader(source, offset, limit);
            if (box == null) {
                return;
            }
            state.boxes++;
            if (topLevel) {
                if ("moov".equals(box.type) && !state.hasMoov()) {
                    state.moovOffset = offset;
                }
                if ("mdat".equals(box.type) && !state.hasMdat()) {
                    state.mdatOffset = offset;
                }
            }
            if (HEVC_TYPES.contains(box.type)) {
                state.hevc = true;
                return;
            }
            if ("ftyp".equals(box.type) && ftypPayloadHasHevcBrand(source, offset, box)) {
                state.hevc = true;
                return;
            }
            long payloadStart = offset + box.headerSize;
            long payloadEnd = offset + box.size;
            if ("stsd".equals(box.type) && payloadStart + 8 < payloadEnd) {
                walk(source, payloadStart + 8, payloadEnd, depth + 1, false, state);
            } else if (CONTAINER_BOXES.contains(box.type)) {
                walkContainer(source, offset, box, payloadStart, payloadEnd, depth, state);
            }
            long next = offset + box.size;
            if (next <= offset) {
                return;
            }
            offset = next;
        }
    }

    private static void walkContainer(
            IsoByteSource source,
            long offset,
            BoxHeader box,
            long payloadStart,
            long payloadEnd,
            int depth,
            ScanState state) throws IOException {
        if ("moov".equals(box.type) && box.size <= MAX_BUFFERED_MOOV && box.size >= box.headerSize) {
            byte[] moov = source.read(offset, (int) box.size);
            if (moov.length == (int) box.size) {
                walk(ofBytes(moov), box.headerSize, moov.length, depth + 1, false, state);
                return;
            }
        }
        walk(source, payloadStart, payloadEnd, depth + 1, false, state);
    }

    private static boolean ftypPayloadHasHevcBrand(IsoByteSource source, long offset, BoxHeader box)
            throws IOException {
        long payloadLen = box.size - box.headerSize;
        if (payloadLen < 4) {
            return false;
        }
        int len = (int) Math.min(payloadLen, 4096);
        byte[] payload = source.read(offset + box.headerSize, len);
        if (payload.length < 4) {
            return false;
        }
        if (isHevcBrand(fourCc(payload, 0))) {
            return true;
        }
        for (int i = 8; i + 4 <= payload.length; i += 4) {
            if (isHevcBrand(fourCc(payload, i))) {
                return true;
            }
        }
        return false;
    }

    private static boolean isHevcBrand(String brand) {
        return HEVC_BRANDS.contains(brand);
    }

    private static BoxHeader readHeader(IsoByteSource source, long offset, long limit) throws IOException {
        long remaining = limit - offset;
        if (remaining < 8) {
            return null;
        }
        int headNeed = remaining >= 16 ? 16 : (int) remaining;
        byte[] header = source.read(offset, headNeed);
        if (header.length < 8) {
            return null;
        }
        long size = readU32(header, 0);
        String type = fourCc(header, 4);
        if (!looksLikeFourCc(type)) {
            return null;
        }
        int headerSize = 8;
        if (size == 1) {
            if (header.length < 16) {
                header = source.read(offset, 16);
                if (header.length < 16) {
                    return null;
                }
            }
            size = readU64(header, 8);
            headerSize = 16;
            if (size < 0) {
                return null;
            }
        } else if (size == 0) {
            size = remaining;
        }
        if (size < headerSize || size > remaining) {
            return null;
        }
        return new BoxHeader(size, type, headerSize);
    }

    private static boolean looksLikeFourCc(String type) {
        if (type == null || type.length() != 4) {
            return false;
        }
        for (int i = 0; i < 4; i++) {
            char c = type.charAt(i);
            if (!(c >= 'a' && c <= 'z') && !(c >= 'A' && c <= 'Z')
                    && !(c >= '0' && c <= '9') && c != ' ') {
                return false;
            }
        }
        return true;
    }

    private static long readU32(byte[] data, int offset) {
        return ((data[offset] & 0xFFL) << 24)
                | ((data[offset + 1] & 0xFFL) << 16)
                | ((data[offset + 2] & 0xFFL) << 8)
                | (data[offset + 3] & 0xFFL);
    }

    private static long readU64(byte[] data, int offset) {
        long high = readU32(data, offset);
        long low = readU32(data, offset + 4);
        if (high > 0x7FFFFFFFL) {
            return -1;
        }
        return (high << 32) | low;
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

    private record BoxHeader(long size, String type, int headerSize) {
    }

    private static final class ScanState {
        boolean hevc;
        long moovOffset = -1;
        long mdatOffset = -1;
        int boxes;

        boolean hasMoov() {
            return moovOffset >= 0;
        }

        boolean hasMdat() {
            return mdatOffset >= 0;
        }
    }

    private static final class RafIsoSource implements IsoByteSource {
        private final RandomAccessFile raf;

        private RafIsoSource(RandomAccessFile raf) {
            this.raf = raf;
        }

        @Override
        public long size() {
            try {
                return raf.length();
            } catch (IOException e) {
                return 0;
            }
        }

        @Override
        public byte[] read(long offset, int length) throws IOException {
            long fileSize = raf.length();
            if (offset < 0 || offset >= fileSize || length <= 0) {
                return new byte[0];
            }
            int want = (int) Math.min(length, fileSize - offset);
            byte[] buf = new byte[want];
            raf.seek(offset);
            int n = raf.read(buf);
            if (n < 0) {
                return new byte[0];
            }
            return n == want ? buf : Arrays.copyOf(buf, n);
        }
    }
}
