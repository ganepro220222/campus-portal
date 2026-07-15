package com.shuyuan.backend.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;

/** 读取 GLB 内 JSON chunk 根节点（供校验与 transform 计算复用）。 */
public final class GlbJsonReader {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private GlbJsonReader() {
    }

    public static JsonNode readRoot(byte[] data) {
        if (data == null || data.length < 20) {
            return null;
        }
        ByteBuffer buf = ByteBuffer.wrap(data).order(ByteOrder.LITTLE_ENDIAN);
        byte[] magic = new byte[4];
        buf.get(magic);
        if (!java.util.Arrays.equals(magic, "glTF".getBytes(StandardCharsets.US_ASCII))) {
            return null;
        }
        int version = buf.getInt();
        if (version != 2) {
            return null;
        }
        buf.getInt(); // total length
        if (buf.remaining() < 8) {
            return null;
        }
        int jsonLen = buf.getInt();
        byte[] chunkType = new byte[4];
        buf.get(chunkType);
        if (!"JSON".equals(new String(chunkType, StandardCharsets.US_ASCII).trim())) {
            return null;
        }
        if (buf.remaining() < jsonLen) {
            return null;
        }
        byte[] jsonBytes = new byte[jsonLen];
        buf.get(jsonBytes);
        try {
            return MAPPER.readTree(jsonBytes);
        } catch (Exception e) {
            return null;
        }
    }
}
