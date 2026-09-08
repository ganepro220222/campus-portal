package com.shuyuan.backend.util;

/**
 * 关联小程序图标在卡片上的展示：裁切方式与外形。
 * 默认完整显示 + 圆角方，与未加字段前的小程序表现一致。
 */
public final class CollegeIconDisplay {

    /** 裁切填满 → aspectFill */
    public static final String FILL = "fill";
    /** 完整显示 → aspectFit */
    public static final String FIT = "fit";
    public static final String SQUARE = "square";
    public static final String CIRCLE = "circle";

    private CollegeIconDisplay() {
    }

    public static String normalizeFit(String mode) {
        if (mode != null && FILL.equalsIgnoreCase(mode.trim())) {
            return FILL;
        }
        return FIT;
    }

    public static String normalizeShape(String shape) {
        if (shape != null && CIRCLE.equalsIgnoreCase(shape.trim())) {
            return CIRCLE;
        }
        return SQUARE;
    }
}
