package com.shuyuan.backend.util;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.safety.Safelist;

/**
 * 富文本入库白名单净化（新闻正文等 HTML 字段）。
 * 与前端 sanitizeRichHtml 互补：后端统一拦截绕过工作台的直接 API 写入。
 * 白名单对齐小程序 rich-text 能渲染的标签，以及编辑器工具栏会写出的属性
 *（颜色、对齐、字号、表格、分隔线、图片宽高）。少一项，排好的版保存后就会消失。
 */
public final class RichHtmlSanitizer {

    private static final Safelist RICH_TEXT = Safelist.none()
            .addTags(
                    "p", "br", "div", "span",
                    "strong", "b", "em", "i", "u", "s", "del", "sub", "sup",
                    "h1", "h2", "h3", "h4", "h5", "h6",
                    "ul", "ol", "li", "blockquote",
                    "a", "img",
                    "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
                    "col", "colgroup",
                    "hr", "pre", "code", "font", "center", "small")
            .addAttributes(":all", "style", "class")
            .addAttributes("a", "href", "title", "target")
            .addAttributes("img", "src", "alt", "title", "width", "height")
            .addAttributes("td", "colspan", "rowspan", "width", "align", "valign")
            .addAttributes("th", "colspan", "rowspan", "width", "align", "valign")
            .addAttributes("table", "width", "border", "cellpadding", "cellspacing", "align")
            .addAttributes("ol", "start", "type")
            .addAttributes("font", "color", "size", "face")
            .addProtocols("a", "href", "http", "https", "mailto")
            .addProtocols("img", "src", "http", "https");

    private RichHtmlSanitizer() {
    }

    public static String sanitize(String html) {
        if (html == null || html.isBlank()) {
            return "";
        }
        Document.OutputSettings compact = new Document.OutputSettings().prettyPrint(false);
        String cleaned = Jsoup.clean(html, "", RICH_TEXT, compact);
        Document doc = Jsoup.parseBodyFragment(cleaned);
        doc.outputSettings(compact);
        for (Element table : doc.select("table")) {
            ensureCss(table, "border-collapse", "collapse");
        }
        for (Element cell : doc.select("th, td")) {
            ensureCss(cell, "border", "1px solid #ccc");
            ensureCss(cell, "padding", "6px");
        }
        for (Element img : doc.select("img")) {
            ensureCss(img, "max-width", "100%");
        }
        return doc.body().html().trim();
    }

    /** 编辑器里表格边框靠样式表，入库后小程序只能认标签上的 style。 */
    private static void ensureCss(Element el, String property, String value) {
        String style = el.attr("style");
        String needle = property.toLowerCase() + ":";
        if (style.toLowerCase().contains(needle)) {
            return;
        }
        String snippet = property + ":" + value;
        if (style.isBlank()) {
            el.attr("style", snippet);
            return;
        }
        String trimmed = style.trim();
        el.attr("style", trimmed.endsWith(";") ? trimmed + snippet : trimmed + ";" + snippet);
    }
}
