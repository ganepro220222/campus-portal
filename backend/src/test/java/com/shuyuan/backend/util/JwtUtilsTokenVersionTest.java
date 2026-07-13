package com.shuyuan.backend.util;

import com.shuyuan.backend.config.ShuyuanProperties;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class JwtUtilsTokenVersionTest {

    @Test
    void createAndParseTokenVersion_roundTrip() {
        ShuyuanProperties props = new ShuyuanProperties();
        props.getJwt().setSecret("test-secret-with-enough-length-for-hmac");
        JwtUtils jwtUtils = new JwtUtils(props);

        String memberToken = jwtUtils.createToken(42L, "openid-x", 7);
        assertEquals(42L, jwtUtils.getMemberId(memberToken));
        assertEquals(7, jwtUtils.getTokenVersion(memberToken));

        String adminToken = jwtUtils.createAdminToken(3L, 2L, 5);
        assertEquals(3L, jwtUtils.getAdminId(adminToken));
        assertEquals(5, jwtUtils.getTokenVersion(adminToken));
    }

    @Test
    void getTokenVersion_defaultsToZeroWhenMissing() {
        ShuyuanProperties props = new ShuyuanProperties();
        props.getJwt().setSecret("legacy-secret-with-enough-length-here");
        JwtUtils jwtUtils = new JwtUtils(props);
        String legacy = jwtUtils.createToken(1L, "o", 0);
        assertEquals(0, jwtUtils.getTokenVersion(legacy));
    }
}
