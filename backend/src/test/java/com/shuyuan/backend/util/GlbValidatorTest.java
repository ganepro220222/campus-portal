package com.shuyuan.backend.util;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

class GlbValidatorTest {

    private static final long MAX = 8L * 1024 * 1024;

    @Test
    void validate_acceptsMinimalMeshGlb() {
        byte[] glb = GlbTestFixtures.meshGlb(GlbTestFixtures.defaultMeshJson(), 36);
        GlbValidator.Result r = GlbValidator.validate(glb, MAX);
        assertTrue(r.valid());
        assertEquals(1, r.meshCount());
        assertNotNull(r.glbSha1());
        assertEquals(40, r.glbSha1().length());
    }

    @Test
    void validate_rejectsAssetOnlyGlb() {
        byte[] glb = GlbTestFixtures.meshGlb("{\"asset\":{\"version\":\"2.0\"}}", 0);
        GlbValidator.Result r = GlbValidator.validate(glb, MAX);
        assertFalse(r.valid());
        assertTrue(r.warnings().stream().anyMatch(w -> w.contains("不含网格")));
    }

    @Test
    void validate_rejectsBadMagic() {
        byte[] glb = GlbTestFixtures.meshGlb(GlbTestFixtures.defaultMeshJson(), 36);
        glb[0] = 'X';
        GlbValidator.Result r = GlbValidator.validate(glb, MAX);
        assertFalse(r.valid());
        assertTrue(r.warnings().stream().anyMatch(w -> w.contains("GLB")));
    }

    @Test
    void validate_rejectsOversize() {
        byte[] glb = GlbTestFixtures.meshGlb(GlbTestFixtures.defaultMeshJson(), 36);
        GlbValidator.Result r = GlbValidator.validate(glb, glb.length - 1);
        assertFalse(r.valid());
        assertTrue(r.warnings().get(0).contains("超过上限"));
    }

    @Test
    void validate_warnsWhenPositionMinMaxMissing() {
        String json = """
                {"asset":{"version":"2.0"},
                 "buffers":[{"byteLength":36}],
                 "bufferViews":[{"buffer":0,"byteLength":36}],
                 "accessors":[{"bufferView":0,"componentType":5126,"count":3,"type":"VEC3"}],
                 "meshes":[{"primitives":[{"attributes":{"POSITION":0}}]}]}\
                """;
        GlbValidator.Result r = GlbValidator.validate(GlbTestFixtures.meshGlb(json, 36), MAX);
        assertTrue(r.valid());
        assertTrue(r.warnings().stream().anyMatch(w -> w.contains("min/max")));
    }

    @Test
    void validate_rejectsExternalImageUri() {
        String json = """
                {"asset":{"version":"2.0"},"images":[{"uri":"tex.png"}],"buffers":[{"byteLength":1}],
                 "meshes":[{"primitives":[{"attributes":{"POSITION":0}}]}],
                 "accessors":[{"min":[0,0,0],"max":[1,1,1],"type":"VEC3"}]}\
                """;
        GlbValidator.Result r = GlbValidator.validate(GlbTestFixtures.meshGlb(json, 1), MAX);
        assertFalse(r.valid());
        assertTrue(r.warnings().stream().anyMatch(w -> w.contains("贴图外链") || w.contains("buffer外链")));
    }

    @Test
    void sha1Hex_isDeterministic() {
        byte[] data = "glTF-test".getBytes(StandardCharsets.UTF_8);
        assertEquals(GlbValidator.sha1Hex(data), GlbValidator.sha1Hex(data));
    }
}
