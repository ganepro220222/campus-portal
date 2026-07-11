package com.shuyuan.backend.util;

/**
 * 封面/轮播图在小程序端的展示模式（对应微信 image mode）
 */
public final class CoverFitMode {

    /** 裁切填满 → aspectFill */
    public static final String FILL = "fill";
    /** 完整显示 → aspectFit */
    public static final String FIT = "fit";

    private CoverFitMode() {
    }

    public static String normalize(String mode) {
        if (mode != null && FIT.equalsIgnoreCase(mode.trim())) {
            return FIT;
        }
        return FILL;
    }
}
