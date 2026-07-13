package com.shuyuan.backend.util;

import com.shuyuan.backend.common.exception.BusinessException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class WxacodePathPolicyTest {

    @Test
    void validateAndNormalize_acceptsWhitelistPath() {
        assertEquals("pages/index/index", WxacodePathPolicy.validateAndNormalize("pages/index/index"));
        assertEquals("packageB/course/detail", WxacodePathPolicy.validateAndNormalize("/packageB/course/detail"));
    }

    @Test
    void validateAndNormalize_rejectsUnknownPath() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> WxacodePathPolicy.validateAndNormalize("random/xxxx"));
        assertEquals(400, ex.getCode());
    }

    @Test
    void validateAndNormalize_rejectsQueryString() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> WxacodePathPolicy.validateAndNormalize("pages/index/index?a=1"));
        assertEquals(400, ex.getCode());
    }

    @Test
    void validateAndNormalize_rejectsOverlongPath() {
        String longPath = "pages/index/" + "a".repeat(WxacodePathPolicy.MAX_PATH_LENGTH);
        BusinessException ex = assertThrows(BusinessException.class,
                () -> WxacodePathPolicy.validateAndNormalize(longPath));
        assertEquals(400, ex.getCode());
    }

    @Test
    void validateAndNormalize_rejectsIllegalChars() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> WxacodePathPolicy.validateAndNormalize("pages/index/index#frag"));
        assertEquals(400, ex.getCode());
    }
}
