package com.shuyuan.backend.util;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.safety.Safelist;

/**
 * 富文本入库白名单净化（新闻正文等 HTML 字段）。
 * 与前端 sanitizeRichHtml 互补：后端统一拦截绕过工作台的直接 API 写入。
 * 白名单对齐小程序 rich-text 能渲染的标签，以及编辑器工具栏会写出的属性。
 * 小程序 rich-text 不吃页面 wxss，编辑器里靠样式表画出的列表点、引用条、标题大小、
 * 图片高度，入库时必须写到标签的 style 上，详情页才能和工具栏效果对上。
 */
public final class RichHtmlSanitizer {

    private static final String INK = "#1F2547";
    private static final String NAVY = "#2B356E";
    private static final String LINE = "#D8DEEA";

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
        decorateForMiniapp(doc);
        return doc.body().html().trim();
    }

    private static void decorateForMiniapp(Document doc) {
        for (Element p : doc.select("p")) {
            ensureCss(p, "text-align", "justify");
            ensureCss(p, "color", INK);
            ensureCss(p, "font-size", "15px");
            ensureCss(p, "line-height", "1.9");
        }
        applyHeading(doc, "h1", "32px");
        applyHeading(doc, "h2", "24px");
        applyHeading(doc, "h3", "18px");
        applyHeading(doc, "h4", "16px");
        applyHeading(doc, "h5", "13px");
        applyHeading(doc, "h6", "13px");
        for (Element ul : doc.select("ul")) {
            ensureCss(ul, "padding-left", "1.6em");
            ensureCss(ul, "margin", "0.4em 0");
            ensureCss(ul, "list-style-type", "disc");
        }
        for (Element ol : doc.select("ol")) {
            ensureCss(ol, "padding-left", "1.6em");
            ensureCss(ol, "margin", "0.4em 0");
            ensureCss(ol, "list-style-type", "decimal");
        }
        for (Element li : doc.select("li")) {
            ensureCss(li, "color", INK);
            ensureCss(li, "line-height", "1.7");
        }
        for (Element quote : doc.select("blockquote")) {
            ensureCss(quote, "border-left", "4px solid " + NAVY);
            ensureCss(quote, "padding", "2px 0 2px 12px");
            ensureCss(quote, "margin", "8px 0");
            ensureCss(quote, "color", "#5A648A");
        }
        for (Element hr : doc.select("hr")) {
            setCss(hr, "border", "none");
            setCss(hr, "border-top", "1px solid " + LINE);
            ensureCss(hr, "margin", "12px 0");
        }
        for (Element pre : doc.select("pre")) {
            ensureCss(pre, "white-space", "pre-wrap");
            ensureCss(pre, "word-break", "break-word");
            ensureCss(pre, "font-size", "13px");
            ensureCss(pre, "background", "#F5F7FB");
            ensureCss(pre, "padding", "8px");
        }
        for (Element table : doc.select("table")) {
            String width = table.attr("width");
            if (width.isBlank() || "auto".equalsIgnoreCase(width.trim())) {
                table.removeAttr("width");
            }
            setCssIfAutoOrMissing(table, "width", "100%");
            ensureCss(table, "border-collapse", "collapse");
            ensureCss(table, "table-layout", "fixed");
        }
        for (Element cell : doc.select("th, td")) {
            if ("auto".equalsIgnoreCase(cell.attr("width"))) {
                cell.removeAttr("width");
            }
            ensureCss(cell, "border", "1px solid #ccc");
            ensureCss(cell, "padding", "6px");
            ensureCss(cell, "word-break", "break-word");
            ensureCss(cell, "color", INK);
        }
        for (Element img : doc.select("img")) {
            img.removeAttr("height");
            setCss(img, "max-width", "100%");
            setCss(img, "height", "auto");
            ensureCss(img, "display", "block");
        }
        for (Element a : doc.select("a")) {
            ensureCss(a, "color", NAVY);
            ensureCss(a, "text-decoration", "underline");
        }
    }

    private static void applyHeading(Document doc, String tag, String fontSize) {
        for (Element heading : doc.select(tag)) {
            ensureCss(heading, "font-size", fontSize);
            ensureCss(heading, "font-weight", "bold");
            ensureCss(heading, "color", INK);
            ensureCss(heading, "line-height", "1.35");
            ensureCss(heading, "margin", "0.7em 0 0.35em");
        }
    }

    private static void setCssIfAutoOrMissing(Element el, String property, String value) {
        String current = cssValue(el.attr("style"), property);
        if (current.isBlank() || "auto".equalsIgnoreCase(current.trim())) {
            setCss(el, property, value);
        }
    }

    private static String cssValue(String style, String property) {
        String needle = property.toLowerCase() + ":";
        for (String part : style.split(";")) {
            String trimmed = part.trim();
            if (trimmed.toLowerCase().startsWith(needle)) {
                return trimmed.substring(needle.length()).trim();
            }
        }
        return "";
    }

    private static boolean hasCssProperty(String style, String property) {
        return !cssValue(style, property).isEmpty();
    }

    private static void ensureCss(Element el, String property, String value) {
        if (hasCssProperty(el.attr("style"), property)) {
            return;
        }
        setCss(el, property, value);
    }

    private static void setCss(Element el, String property, String value) {
        String style = el.attr("style");
        StringBuilder out = new StringBuilder();
        String needle = property.toLowerCase() + ":";
        if (style != null && !style.isBlank()) {
            for (String part : style.split(";")) {
                String trimmed = part.trim();
                if (trimmed.isEmpty()) {
                    continue;
                }
                if (trimmed.toLowerCase().startsWith(needle)) {
                    continue;
                }
                if (out.length() > 0) {
                    out.append(';');
                }
                out.append(trimmed);
            }
        }
        if (out.length() > 0) {
            out.append(';');
        }
        out.append(property).append(':').append(value);
        el.attr("style", out.toString());
    }
}
