package com.shuyuan.backend.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CollegeIconDisplayTest {

    @Test
    void normalizeFit_defaultsToFit() {
        assertEquals(CollegeIconDisplay.FIT, CollegeIconDisplay.normalizeFit(null));
        assertEquals(CollegeIconDisplay.FIT, CollegeIconDisplay.normalizeFit(""));
        assertEquals(CollegeIconDisplay.FIT, CollegeIconDisplay.normalizeFit("fit"));
        assertEquals(CollegeIconDisplay.FIT, CollegeIconDisplay.normalizeFit("other"));
    }

    @Test
    void normalizeFit_acceptsFill() {
        assertEquals(CollegeIconDisplay.FILL, CollegeIconDisplay.normalizeFit("fill"));
        assertEquals(CollegeIconDisplay.FILL, CollegeIconDisplay.normalizeFit(" FILL "));
    }

    @Test
    void normalizeShape_defaultsToSquare() {
        assertEquals(CollegeIconDisplay.SQUARE, CollegeIconDisplay.normalizeShape(null));
        assertEquals(CollegeIconDisplay.SQUARE, CollegeIconDisplay.normalizeShape(""));
        assertEquals(CollegeIconDisplay.SQUARE, CollegeIconDisplay.normalizeShape("square"));
        assertEquals(CollegeIconDisplay.SQUARE, CollegeIconDisplay.normalizeShape("round"));
    }

    @Test
    void normalizeShape_acceptsCircle() {
        assertEquals(CollegeIconDisplay.CIRCLE, CollegeIconDisplay.normalizeShape("circle"));
        assertEquals(CollegeIconDisplay.CIRCLE, CollegeIconDisplay.normalizeShape(" CIRCLE "));
    }
}
