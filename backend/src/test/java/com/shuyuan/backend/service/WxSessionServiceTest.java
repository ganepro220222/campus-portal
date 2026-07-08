package com.shuyuan.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.config.ShuyuanProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class WxSessionServiceTest {

    private ShuyuanProperties properties;
    private WxSessionService wxSessionService;

    @BeforeEach
    void setUp() {
        properties = new ShuyuanProperties();
        wxSessionService = new WxSessionService(properties, new ObjectMapper());
    }

    @Test
    void resolveOpenid_devMode_returnsPrefixedCode() {
        properties.getWx().setDevMode(true);
        assertEquals("dev_abc123", wxSessionService.resolveOpenid("abc123"));
    }

    @Test
    void resolveOpenid_devMode_rejectsBlankCode() {
        properties.getWx().setDevMode(true);
        assertThrows(BusinessException.class, () -> wxSessionService.resolveOpenid("  "));
    }

    @Test
    void resolveOpenid_prodMode_requiresAppConfig() {
        properties.getWx().setDevMode(false);
        BusinessException ex = assertThrows(BusinessException.class,
                () -> wxSessionService.resolveOpenid("real-code"));
        assertEquals(500, ex.getCode());
    }

    @Test
    void parseOpenid_readsOpenidFromJson() {
        String openid = wxSessionService.parseOpenid("{\"openid\":\"oABC\",\"session_key\":\"sk\"}");
        assertEquals("oABC", openid);
    }

    @Test
    void parseOpenid_mapsInvalidCodeError() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> wxSessionService.parseOpenid("{\"errcode\":40029,\"errmsg\":\"invalid code\"}"));
        assertEquals(400, ex.getCode());
    }
}
