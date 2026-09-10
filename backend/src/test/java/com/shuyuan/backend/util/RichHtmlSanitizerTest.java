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

    @Test
    void sanitize_keepsEditorLayoutThatMiniappCanRender() {
        String input = "<p style=\"text-align: center;\"><span style=\"color: rgb(192, 57, 43); font-size: 18px;\">红字</span></p>"
                + "<table><tbody><tr><td colspan=\"2\">单元格</td></tr></tbody></table>"
                + "<hr/>"
                + "<img src=\"https://cdn.example.com/a.png\" alt=\"图\" width=\"320\" style=\"width: 100%;\" />";
        String out = RichHtmlSanitizer.sanitize(input);
        assertTrue(out.contains("text-align: center") || out.contains("text-align:center"), out);
        assertTrue(out.contains("color:"), out);
        assertTrue(out.contains("<table"), out);
        assertTrue(out.contains("单元格"), out);
        assertTrue(out.contains("<hr"), out);
        assertTrue(out.contains("width"), out);
        assertTrue(out.contains("https://cdn.example.com/a.png"), out);
        assertTrue(out.contains("border-collapse"), out);
        assertTrue(out.contains("1px solid #ccc"), out);
        assertTrue(out.contains("max-width:100%") || out.contains("max-width: 100%"), out);
        assertTrue(out.contains("height:auto") || out.contains("height: auto"), out);
    }

    @Test
    void sanitize_keepsExplicitAlignAndAddsMiniappDefaults() {
        String out = RichHtmlSanitizer.sanitize(
                "<p>普通段</p>"
                        + "<h2>二级标题</h2>"
                        + "<ul><li>条目</li></ul>"
                        + "<ol><li>其一</li></ol>"
                        + "<blockquote>引语</blockquote>"
                        + "<pre><code>code</code></pre>"
                        + "<img src=\"https://cdn.example.com/a.png\" alt=\"图\" style=\"width: 800px;height: 600px;\" height=\"600\" />");
        assertTrue(out.contains("justify"), out);
        assertTrue(out.contains("font-size:24px") || out.contains("font-size: 24px"), out);
        assertTrue(out.contains("list-style-type:disc") || out.contains("list-style-type: disc"), out);
        assertTrue(out.contains("list-style-type:decimal") || out.contains("list-style-type: decimal"), out);
        assertTrue(out.contains("border-left"), out);
        assertTrue(out.contains("pre-wrap"), out);
        assertTrue(out.contains("height:auto") || out.contains("height: auto"), out);
        assertFalse(out.contains("height=\"600\""), out);
        assertTrue(out.contains("width:100%") || out.contains("width: 100%") || !out.contains("<table"), out);
    }

    @Test
    void sanitize_stillDropsDataUriImages() {
        String out = RichHtmlSanitizer.sanitize("<p><img src=\"data:image/png;base64,aaaa\" alt=\"x\"></p>");
        assertFalse(out.toLowerCase().contains("data:"));
    }
}
