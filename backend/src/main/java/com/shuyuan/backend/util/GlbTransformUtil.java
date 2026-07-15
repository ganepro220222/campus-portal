package com.shuyuan.backend.util;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 从 GLB accessor min/max 计算归一化参数（与 Python glb_utils.compute_transform 策略一致：几何中心归零）。
 */
public final class GlbTransformUtil {

    /** 与批处理脚本 TARGET_SIZE 一致 */
    private static final double TARGET_SIZE = 3.0;

    private GlbTransformUtil() {
    }

    /**
     * 根据 POSITION accessor 的 min/max 聚合包围盒并计算 transform。
     * 无法计算时返回 null（例如 accessor 缺少 min/max）。
     */
    public static Map<String, Object> computeTransform(byte[] glbBytes) {
        Bounds bounds = collectPositionBounds(glbBytes);
        if (bounds == null) {
            return null;
        }
        return bounds.toTransform();
    }

    /** 是否具备自动归一化所需数据（至少一个 POSITION accessor 且含 min/max）。 */
    public static boolean canAutoNormalize(byte[] glbBytes) {
        return collectPositionBounds(glbBytes) != null;
    }

    private static Bounds collectPositionBounds(byte[] glbBytes) {
        JsonNode root = GlbJsonReader.readRoot(glbBytes);
        if (root == null) {
            return null;
        }
        JsonNode meshes = root.path("meshes");
        JsonNode accessors = root.path("accessors");
        if (!meshes.isArray() || meshes.isEmpty() || !accessors.isArray()) {
            return null;
        }

        double minX = Double.POSITIVE_INFINITY;
        double minY = Double.POSITIVE_INFINITY;
        double minZ = Double.POSITIVE_INFINITY;
        double maxX = Double.NEGATIVE_INFINITY;
        double maxY = Double.NEGATIVE_INFINITY;
        double maxZ = Double.NEGATIVE_INFINITY;
        boolean found = false;

        for (JsonNode mesh : meshes) {
            JsonNode primitives = mesh.path("primitives");
            if (!primitives.isArray()) {
                continue;
            }
            for (JsonNode primitive : primitives) {
                JsonNode posIdx = primitive.path("attributes").path("POSITION");
                if (!posIdx.isInt()) {
                    continue;
                }
                JsonNode accessor = accessors.get(posIdx.asInt());
                if (accessor == null || !accessor.has("min") || !accessor.has("max")) {
                    return null;
                }
                JsonNode min = accessor.get("min");
                JsonNode max = accessor.get("max");
                if (min.size() < 3 || max.size() < 3) {
                    return null;
                }
                minX = Math.min(minX, min.get(0).asDouble());
                minY = Math.min(minY, min.get(1).asDouble());
                minZ = Math.min(minZ, min.get(2).asDouble());
                maxX = Math.max(maxX, max.get(0).asDouble());
                maxY = Math.max(maxY, max.get(1).asDouble());
                maxZ = Math.max(maxZ, max.get(2).asDouble());
                found = true;
            }
        }

        if (!found) {
            return null;
        }

        return new Bounds(minX, minY, minZ, maxX, maxY, maxZ);
    }

    private record Bounds(double minX, double minY, double minZ, double maxX, double maxY, double maxZ) {
        Map<String, Object> toTransform() {
            double sizeX = maxX - minX;
            double sizeY = maxY - minY;
            double sizeZ = maxZ - minZ;
            double longest = Math.max(sizeX, Math.max(sizeY, sizeZ));
            if (longest <= 0) {
                return null;
            }
            double centerX = (maxX + minX) / 2.0;
            double centerY = (maxY + minY) / 2.0;
            double centerZ = (maxZ + minZ) / 2.0;
            double scale = TARGET_SIZE / longest;

            Map<String, Object> transform = new LinkedHashMap<>();
            transform.put("scale", round5(scale));
            transform.put("offsetX", round5(-centerX * scale));
            transform.put("offsetY", round5(-centerY * scale));
            transform.put("offsetZ", round5(-centerZ * scale));
            transform.put("floorOffsetY", round5(-minY * scale));
            return transform;
        }
    }

    private static double round5(double v) {
        return Math.round(v * 100000.0) / 100000.0;
    }
}
