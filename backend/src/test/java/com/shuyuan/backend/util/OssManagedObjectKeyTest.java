package com.shuyuan.backend.util;

import org.junit.jupiter.api.Test;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OssManagedObjectKeyTest {

    @Test
    void extractManaged_fromCdnAndBareKey() {
        assertEquals("videos/202608/abc.mp4",
                OssManagedObjectKey.extractManaged("https://cdn.yunmanvr.com/videos/202608/abc.mp4"));
        assertEquals("images/202608/cover.jpg",
                OssManagedObjectKey.extractManaged("images/202608/cover.jpg"));
        assertEquals("subtitles/202608/a.vtt",
                OssManagedObjectKey.extractManaged(
                        "https://yunman-shuyuan.oss-cn-chengdu.aliyuncs.com/subtitles/202608/a.vtt?Expires=1&Signature=x"));
    }

    @Test
    void extractManaged_rejectsStudioAndTraversal() {
        assertNull(OssManagedObjectKey.extractManaged("craft-demo/model.glb"));
        assertNull(OssManagedObjectKey.extractManaged("https://cdn.yunmanvr.com/exhibits/hall/a.jpg"));
        assertNull(OssManagedObjectKey.extractManaged("videos/../images/x.jpg"));
        assertNull(OssManagedObjectKey.extractManaged("https://evil.example/not-our-prefix.png"));
        assertFalse(OssManagedObjectKey.isManaged("shared/bg.jpg"));
    }

    @Test
    void extractAllManaged_fromHtmlKeepsOnlyAdminPrefixes() {
        String html = "<p><img src=\"https://cdn.yunmanvr.com/images/202608/a.jpg\">"
                + "<img src=\"/exhibits/old.png\"></p>";
        Set<String> keys = OssManagedObjectKey.extractAllManaged(List.of(html, "files/202608/b.pdf"));
        assertEquals(Set.of("images/202608/a.jpg", "files/202608/b.pdf"), keys);
    }

    @Test
    void sameKeyFromDifferentUrlForms() {
        Set<String> keys = new LinkedHashSet<>();
        OssManagedObjectKey.addManagedFrom("https://cdn.yunmanvr.com/videos/202608/x.mp4", keys);
        OssManagedObjectKey.addManagedFrom("videos/202608/x.mp4", keys);
        assertEquals(1, keys.size());
        assertTrue(keys.contains("videos/202608/x.mp4"));
    }
}
