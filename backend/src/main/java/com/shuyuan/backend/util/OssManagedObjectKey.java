package com.shuyuan.backend.util;

import java.net.URI;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 后台上传产生的 OSS objectKey 白名单。
 *
 * <p>只认 {@code videos/} {@code images/} {@code subtitles/} {@code files/} {@code audios/}。
 * 展陈工作室目录（{@code craft-*}、共享背景、{@code exhibits/}）一律不当作可删对象。
 */
public final class OssManagedObjectKey {

    public static final List<String> PREFIXES = List.of(
            "videos/", "images/", "subtitles/", "files/", "audios/");

    private static final int MAX_KEY_LENGTH = 512;

    /**
     * 从库字段、CDN URL、富文本 HTML 里捞后台素材 key。
     * 必须带扩展名，避免误匹配目录前缀本身。
     */
    private static final Pattern MANAGED_IN_TEXT = Pattern.compile(
            "(?:https?://[^\\s\"'<>\\\\]+/)?"
                    + "((?:videos|images|subtitles|files|audios)/"
                    + "[A-Za-z0-9][A-Za-z0-9_./-]*\\.[A-Za-z0-9]{2,8})",
            Pattern.CASE_INSENSITIVE);

    private OssManagedObjectKey() {}

    /** 解析存储值中的路径；不校验前缀。非法则 null。 */
    public static String extract(String stored) {
        if (stored == null || stored.isBlank()) {
            return null;
        }
        String trimmed = stored.trim();
        String key;
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            try {
                String path = URI.create(trimmed).getPath();
                if (path == null || path.isBlank() || "/".equals(path)) {
                    return null;
                }
                key = path.startsWith("/") ? path.substring(1) : path;
            } catch (Exception e) {
                return null;
            }
        } else {
            key = trimmed.startsWith("/") ? trimmed.substring(1) : trimmed;
        }
        int q = key.indexOf('?');
        if (q >= 0) {
            key = key.substring(0, q);
        }
        return sanitize(key);
    }

    /** 仅当 key 属于后台可删前缀时返回，否则 null。 */
    public static String extractManaged(String stored) {
        String key = extract(stored);
        return isManaged(key) ? key : null;
    }

    public static boolean isManaged(String objectKey) {
        if (sanitize(objectKey) == null) {
            return false;
        }
        String key = objectKey.trim();
        for (String prefix : PREFIXES) {
            if (key.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }

    /** 从一批存储值 / HTML 中收集可删 key（去重、保序）。 */
    public static Set<String> extractAllManaged(Collection<String> blobs) {
        Set<String> keys = new LinkedHashSet<>();
        if (blobs == null) {
            return keys;
        }
        for (String blob : blobs) {
            addManagedFrom(blob, keys);
        }
        return keys;
    }

    public static void addManagedFrom(String blob, Set<String> out) {
        if (blob == null || blob.isBlank()) {
            return;
        }
        String managed = extractManaged(blob);
        if (managed != null) {
            out.add(managed);
        }
        Matcher matcher = MANAGED_IN_TEXT.matcher(blob);
        while (matcher.find()) {
            String key = sanitize(matcher.group(1));
            if (isManaged(key)) {
                out.add(key);
            }
        }
    }

    private static String sanitize(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) {
            return null;
        }
        String key = objectKey.trim();
        if (key.length() > MAX_KEY_LENGTH) {
            return null;
        }
        if (key.contains("..") || key.contains("\\") || key.contains("\0")) {
            return null;
        }
        String lower = key.toLowerCase(Locale.ROOT);
        if (lower.startsWith("craft-") || lower.startsWith("exhibits/")
                || lower.contains("/craft-") || lower.startsWith("shared/")
                || lower.contains("共享")) {
            return null;
        }
        return key;
    }
}
