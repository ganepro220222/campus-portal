package com.shuyuan.backend.util;

import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;

/**
 * 富文本入库白名单净化（新闻正文等 HTML 字段）。
 * 与前端 {@code sanitizeRichHtml} 互补：后端统一拦截绕过管理端的直接 API 写入。
 */
public final class RichHtmlSanitizer {

    private static final Safelist RICH_TEXT = Safelist.none()
            .addTags(
                    "p", "br", "div", "span",
                    "strong", "b", "em", "i", "u", "s", "del", "sub", "sup",
                    "h1", "h2", "h3", "h4", "h5", "h6",
                    "ul", "ol", "li", "blockquote",
                    "a", "img")
            .addAttributes("a", "href", "title", "target")
            .addAttributes("img", "src", "alt", "title")
            .addProtocols("a", "href", "http", "https", "mailto")
            .addProtocols("img", "src", "http", "https");

    private RichHtmlSanitizer() {
    }

    public static String sanitize(String html) {
        if (html == null || html.isBlank()) {
            return "";
        }
        return Jsoup.clean(html, RICH_TEXT).trim();
    }
}
