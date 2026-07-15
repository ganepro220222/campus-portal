package com.shuyuan.backend.util;

import com.fasterxml.jackson.databind.JsonNode;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;

/**
 * GLB 入库前校验：magic、版本、贴图内嵌、体积与扩展名警告。
 */
public final class GlbValidator {

    private static final byte[] GLB_MAGIC = "glTF".getBytes(StandardCharsets.US_ASCII);
    private static final int GLB_VERSION = 2;
    private static final Set<String> RISKY_EXTENSIONS = Set.of(
            "KHR_draco_mesh_compression",
            "EXT_meshopt_compression"
    );

    private GlbValidator() {
    }

    public record Result(
            boolean valid,
            String glbSha1,
            int meshCount,
            int materialCount,
            int imageCount,
            boolean imagesEmbedded,
            List<String> warnings
    ) {
    }

    public static Result validate(byte[] data, long maxBytes) {
        List<String> warnings = new ArrayList<>();
        if (data == null || data.length < 20) {
            return new Result(false, null, 0, 0, 0, false, List.of("文件过短"));
        }
        if (data.length > maxBytes) {
            return new Result(false, null, 0, 0, 0, false,
                    List.of("文件超过上限 " + (maxBytes / 1024 / 1024) + "MB"));
        }

        ByteBuffer buf = ByteBuffer.wrap(data).order(ByteOrder.LITTLE_ENDIAN);
        byte[] magic = new byte[4];
        buf.get(magic);
        if (!java.util.Arrays.equals(magic, GLB_MAGIC)) {
            return new Result(false, sha1Hex(data), 0, 0, 0, false, List.of("非 GLB 格式"));
        }
        int version = buf.getInt();
        if (version != GLB_VERSION) {
            return new Result(false, sha1Hex(data), 0, 0, 0, false, List.of("仅支持 glTF 2.0"));
        }
        buf.getInt(); // total length — GlbJsonReader 会重新解析 JSON

        JsonNode root = GlbJsonReader.readRoot(data);
        if (root == null) {
            return new Result(false, sha1Hex(data), 0, 0, 0, false, List.of("JSON 解析失败"));
        }
        try {
            int meshes = root.path("meshes").size();
            if (meshes <= 0) {
                return new Result(false, sha1Hex(data), 0, 0, 0, false, List.of("GLB 不含网格"));
            }
            if (!GlbTransformUtil.canAutoNormalize(data)) {
                warnings.add("缺少 POSITION accessor min/max，上传时须手动导入 transform");
            }
            int materials = root.path("materials").size();
            JsonNode images = root.path("images");
            int imageCount = images.size();
            boolean embedded = true;
            if (imageCount > 0) {
                for (JsonNode img : images) {
                    if (!img.has("bufferView")) {
                        embedded = false;
                        warnings.add("贴图外链");
                        break;
                    }
                }
            }
            JsonNode buffers = root.path("buffers");
            for (JsonNode b : buffers) {
                if (b.has("uri")) {
                    warnings.add("buffer外链");
                    embedded = false;
                    break;
                }
            }
            JsonNode extUsed = root.path("extensionsUsed");
            if (extUsed.isArray()) {
                for (JsonNode ext : extUsed) {
                    String name = ext.asText();
                    if (RISKY_EXTENSIONS.contains(name)) {
                        warnings.add("扩展:" + name);
                    }
                }
            }
            if (!embedded) {
                return new Result(false, sha1Hex(data), meshes, materials, imageCount, false, warnings);
            }
            return new Result(true, sha1Hex(data), meshes, materials, imageCount, true, warnings);
        } catch (Exception e) {
            return new Result(false, sha1Hex(data), 0, 0, 0, false, List.of("JSON 解析失败"));
        }
    }

    public static String sha1Hex(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-1");
            return HexFormat.of().formatHex(digest.digest(data));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-1 不可用", e);
        }
    }
}
