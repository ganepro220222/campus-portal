package com.shuyuan.backend.util;

import org.junit.jupiter.api.Test;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

class GlbValidatorTest {

    private static final long MAX = 8L * 1024 * 1024;

    @Test
    void validate_acceptsMinimalEmbeddedGlb() {
        byte[] glb = minimalGlb("{\"asset\":{\"version\":\"2.0\"}}");
        GlbValidator.Result r = GlbValidator.validate(glb, MAX);
        assertTrue(r.valid());
        assertNotNull(r.glbSha1());
        assertEquals(40, r.glbSha1().length());
    }

    @Test
    void validate_rejectsBadMagic() {
        byte[] glb = minimalGlb("{\"asset\":{\"version\":\"2.0\"}}");
        glb[0] = 'X';
        GlbValidator.Result r = GlbValidator.validate(glb, MAX);
        assertFalse(r.valid());
        assertTrue(r.warnings().stream().anyMatch(w -> w.contains("GLB")));
    }

    @Test
    void validate_rejectsOversize() {
        byte[] glb = minimalGlb("{\"asset\":{\"version\":\"2.0\"}}");
        GlbValidator.Result r = GlbValidator.validate(glb, glb.length - 1);
        assertFalse(r.valid());
        assertTrue(r.warnings().get(0).contains("超过上限"));
    }

    @Test
    void validate_rejectsExternalImageUri() {
        String json = """
                {"asset":{"version":"2.0"},"images":[{"uri":"tex.png"}],"buffers":[{"byteLength":1}]}\
                """;
        GlbValidator.Result r = GlbValidator.validate(minimalGlb(json), MAX);
        assertFalse(r.valid());
        assertTrue(r.warnings().stream().anyMatch(w -> w.contains("贴图外链") || w.contains("buffer外链")));
    }

    @Test
    void sha1Hex_isDeterministic() {
        byte[] data = "glTF-test".getBytes(StandardCharsets.UTF_8);
        assertEquals(GlbValidator.sha1Hex(data), GlbValidator.sha1Hex(data));
    }

    static byte[] minimalGlb(String json) {
        byte[] jsonBytes = json.getBytes(StandardCharsets.UTF_8);
        int jsonPad = (4 - (jsonBytes.length % 4)) % 4;
        int jsonChunkLen = jsonBytes.length + jsonPad;
        int totalLen = 12 + 8 + jsonChunkLen;
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
        return buf.array();
    }
}
