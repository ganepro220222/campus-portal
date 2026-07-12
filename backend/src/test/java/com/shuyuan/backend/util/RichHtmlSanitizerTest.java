package com.shuyuan.backend.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RichHtmlSanitizerTest {

    @Test
    void sanitize_removesScriptAndEventHandlers() {
        String input = "<p onclick=\"evil()\">ok</p><script>alert(1)</script>";
        String out = RichHtmlSanitizer.sanitize(input);
        assertTrue(out.contains("ok"));
        assertFalse(out.toLowerCase().contains("script"));
        assertFalse(out.contains("onclick"));
    }

    @Test
    void sanitize_blocksJavascriptUrls() {
        String input = "<a href=\"javascript:alert(1)\">link</a>";
        String out = RichHtmlSanitizer.sanitize(input);
        assertFalse(out.toLowerCase().contains("javascript:"));
    }

    @Test
    void sanitize_keepsAllowedTagsAndHttpsAssets() {
        String input = "<p><strong>标题</strong></p><img src=\"https://cdn.example.com/a.png\" alt=\"图\" />";
        String out = RichHtmlSanitizer.sanitize(input);
        assertTrue(out.contains("<strong>"));
        assertTrue(out.contains("https://cdn.example.com/a.png"));
    }

    @Test
    void sanitize_blankReturnsEmpty() {
        assertEquals("", RichHtmlSanitizer.sanitize(null));
        assertEquals("", RichHtmlSanitizer.sanitize("   "));
    }
}
