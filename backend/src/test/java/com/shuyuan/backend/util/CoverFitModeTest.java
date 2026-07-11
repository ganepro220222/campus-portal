package com.shuyuan.backend.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CoverFitModeTest {

    @Test
    void normalize_defaultsToFill() {
        assertEquals(CoverFitMode.FILL, CoverFitMode.normalize(null));
        assertEquals(CoverFitMode.FILL, CoverFitMode.normalize(""));
        assertEquals(CoverFitMode.FILL, CoverFitMode.normalize("fill"));
    }

    @Test
    void normalize_acceptsFit() {
        assertEquals(CoverFitMode.FIT, CoverFitMode.normalize("fit"));
        assertEquals(CoverFitMode.FIT, CoverFitMode.normalize(" FIT "));
    }
}
