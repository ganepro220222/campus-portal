package com.shuyuan.backend.util;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MemberBearerTokenTest {

    @Test
    void prefersAuthorizationHeader() {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/v1/resources/9/file");
        req.addHeader("Authorization", "Bearer header-token");
        req.setParameter("access_token", "query-token");
        assertEquals("header-token", MemberBearerToken.from(req));
    }

    @Test
    void acceptsAccessTokenQueryOnResourceFileGet() {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/v1/resources/9/file");
        req.setParameter("access_token", " query-token ");
        assertEquals("query-token", MemberBearerToken.from(req));
        assertTrue(MemberBearerToken.isResourceFileGet(req));
    }

    @Test
    void acceptsAccessTokenQueryOnResourceFileWithExtension() {
        MockHttpServletRequest req = new MockHttpServletRequest(
                "GET", "/api/v1/resources/9/file/document.pdf");
        req.setParameter("access_token", "query-token");
        assertEquals("query-token", MemberBearerToken.from(req));
        assertTrue(MemberBearerToken.isResourceFileGet(req));
    }

    @Test
    void ignoresAccessTokenQueryOnOtherApis() {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/v1/courses/1/play");
        req.setParameter("access_token", "query-token");
        assertEquals("", MemberBearerToken.from(req));
        assertFalse(MemberBearerToken.isResourceFileGet(req));
    }
}
