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
}
