package com.shuyuan.backend.util;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;

/** 测试用最小 GLB 构造。 */
public final class GlbTestFixtures {

    private GlbTestFixtures() {
    }

    public static byte[] meshGlb(String json, int binLen) {
        byte[] jsonBytes = json.getBytes(StandardCharsets.UTF_8);
        int jsonPad = (4 - (jsonBytes.length % 4)) % 4;
        int binPad = binLen > 0 ? (4 - (binLen % 4)) % 4 : 0;
        int totalLen = 12 + 8 + jsonBytes.length + jsonPad;
        if (binLen > 0) {
            totalLen += 8 + binLen + binPad;
        }
        ByteBuffer buf = ByteBuffer.allocate(totalLen).order(ByteOrder.LITTLE_ENDIAN);
        buf.put("glTF".getBytes(StandardCharsets.US_ASCII));
        buf.putInt(2);
        buf.putInt(totalLen);
        buf.putInt(jsonBytes.length);
        buf.put("JSON".getBytes(StandardCharsets.US_ASCII));
        buf.put(jsonBytes);
        for (int i = 0; i < jsonPad; i++) {
            buf.put((byte) 0x20);
        }
        if (binLen > 0) {
            buf.putInt(binLen);
            buf.put("BIN\0".getBytes(StandardCharsets.US_ASCII));
            for (int i = 0; i < binLen; i++) {
                buf.put((byte) 0);
            }
            for (int i = 0; i < binPad; i++) {
                buf.put((byte) 0);
            }
        }
        return buf.array();
    }

    public static String defaultMeshJson() {
        return """
                {"asset":{"version":"2.0"},
                 "buffers":[{"byteLength":36}],
                 "bufferViews":[{"buffer":0,"byteLength":36}],
                 "accessors":[{"bufferView":0,"componentType":5126,"count":3,"type":"VEC3","min":[-1,0,-1],"max":[1,2,1]}],
                 "meshes":[{"primitives":[{"attributes":{"POSITION":0}}]}]}\
                """;
    }
}
