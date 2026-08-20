package com.shuyuan.backend.util;

import com.shuyuan.backend.common.exception.BusinessException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class NavPathPolicyTest {

    @Test
    void normalize_allowsKnownMiniappPath() {
        assertEquals("/pages/news/index", NavPathPolicy.normalize("/pages/news/index"));
        assertEquals("/packageB/resource/list", NavPathPolicy.normalize("packageB/resource/list"));
    }

    @Test
    void normalize_rejectsUnknownPath() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> NavPathPolicy.normalize("https://evil.example.com"));
        assertEquals(400, ex.getCode());
    }
}
