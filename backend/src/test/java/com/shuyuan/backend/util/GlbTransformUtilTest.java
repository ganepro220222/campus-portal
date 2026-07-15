package com.shuyuan.backend.util;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class GlbTransformUtilTest {

    @Test
    void computeTransform_fromAccessorMinMax() {
        String json = """
                {"asset":{"version":"2.0"},
                 "buffers":[{"byteLength":36}],
                 "bufferViews":[{"buffer":0,"byteLength":36}],
                 "accessors":[{"bufferView":0,"componentType":5126,"count":3,"type":"VEC3","min":[-2,0,-1],"max":[2,4,1]}],
                 "meshes":[{"primitives":[{"attributes":{"POSITION":0}}]}]}\
                """;
        Map<String, Object> t = GlbTransformUtil.computeTransform(GlbTestFixtures.meshGlb(json, 36));
        assertNotNull(t);
        assertEquals(0.75, (Double) t.get("scale"), 0.0001);
        assertEquals(0.0, (Double) t.get("offsetX"), 0.0001);
        assertEquals(-1.5, (Double) t.get("offsetY"), 0.0001);
        assertEquals(0.0, (Double) t.get("offsetZ"), 0.0001);
    }

    @Test
    void computeTransform_returnsNullWhenMinMaxMissing() {
        String json = """
                {"asset":{"version":"2.0"},
                 "meshes":[{"primitives":[{"attributes":{"POSITION":0}}]}],
                 "accessors":[{"componentType":5126,"count":3,"type":"VEC3"}]}\
                """;
        byte[] glb = GlbTestFixtures.meshGlb(json, 0);
        assertFalse(GlbTransformUtil.canAutoNormalize(glb));
        assertNull(GlbTransformUtil.computeTransform(glb));
    }
}
