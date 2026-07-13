package com.shuyuan.backend.service;

import com.shuyuan.backend.config.ShuyuanProperties;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNull;

class WxQrcodeServiceTest {

    @Test
    void getWxaCode_returnsNullInDevMode() {
        ShuyuanProperties props = new ShuyuanProperties();
        props.getWx().setDevMode(true);
        WxQrcodeService service = new WxQrcodeService(
                new WxAccessTokenService(props, new com.fasterxml.jackson.databind.ObjectMapper()),
                props,
                new com.fasterxml.jackson.databind.ObjectMapper());
        assertNull(service.getWxaCode("pages/index/index", 280));
    }

    @Test
    void getWxaCode_rejectsNonWhitelistPath() {
        ShuyuanProperties props = new ShuyuanProperties();
        props.getWx().setDevMode(true);
        WxQrcodeService service = new WxQrcodeService(
                new WxAccessTokenService(props, new com.fasterxml.jackson.databind.ObjectMapper()),
                props,
                new com.fasterxml.jackson.databind.ObjectMapper());
        com.shuyuan.backend.common.exception.BusinessException ex =
                org.junit.jupiter.api.Assertions.assertThrows(
                        com.shuyuan.backend.common.exception.BusinessException.class,
                        () -> service.getWxaCode("evil/random", 280));
        org.junit.jupiter.api.Assertions.assertEquals(400, ex.getCode());
    }
}
