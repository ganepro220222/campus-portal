package com.shuyuan.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shuyuan.backend.config.ShuyuanProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;

class AlertWebhookServiceTest {

    private ShuyuanProperties properties;
    private AlertWebhookService alertWebhookService;

    @BeforeEach
    void setUp() {
        properties = new ShuyuanProperties();
        alertWebhookService = new AlertWebhookService(properties, new ObjectMapper());
    }

    @Test
    void sendText_skipsWhenDisabled() {
        properties.getAlert().setEnabled(false);
        properties.getAlert().setWebhookUrl("https://example.com/hook");

        assertFalse(alertWebhookService.sendText("health-down", "测试", "详情"));
    }

    @Test
    void sendText_skipsWhenWebhookMissing() {
        properties.getAlert().setEnabled(true);
        properties.getAlert().setWebhookUrl("");

        assertFalse(alertWebhookService.sendText("health-down", "测试", "详情"));
    }
}
