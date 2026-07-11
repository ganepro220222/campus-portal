package com.shuyuan.backend.service;

import com.shuyuan.backend.config.ShuyuanProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;
import org.springframework.test.util.ReflectionTestUtils;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OpsAlertServiceTest {

    @Mock
    private HealthProbeService healthProbeService;
    @Mock
    private ApiErrorMetrics apiErrorMetrics;
    @Mock
    private AlertWebhookService alertWebhookService;
    @Mock
    private Environment environment;

    private ShuyuanProperties properties;
    private OpsAlertService opsAlertService;

    @BeforeEach
    void setUp() {
        properties = new ShuyuanProperties();
        properties.getAlert().setEnabled(true);
        properties.getAlert().setErrorRatePercent(1.0);
        properties.getAlert().setMinSampleSize(10);
        opsAlertService = new OpsAlertService(
                properties, healthProbeService, apiErrorMetrics, alertWebhookService, environment);
        ReflectionTestUtils.setField(opsAlertService, "version", "0.9.0-rc");
    }

    private void stubProfile() {
        when(environment.getActiveProfiles()).thenReturn(new String[] {"docker"});
    }

    @Test
    void evaluateAndAlert_skipsWhenDisabled() {
        properties.getAlert().setEnabled(false);

        opsAlertService.evaluateAndAlert();

        verify(healthProbeService, never()).probe();
        verify(apiErrorMetrics, never()).snapshotAndReset();
    }

    @Test
    void evaluateAndAlert_sendsHealthAlertWhenDependenciesDown() {
        stubProfile();
        when(healthProbeService.probe()).thenReturn(new HealthProbeService.HealthSnapshot("DOWN", "DOWN", "UP"));
        when(apiErrorMetrics.snapshotAndReset()).thenReturn(new ApiErrorMetrics.Snapshot(0, 0));

        opsAlertService.evaluateAndAlert();

        verify(alertWebhookService).sendText(eq("health-down"), anyString(), anyString());
    }

    @Test
    void evaluateAndAlert_sendsErrorRateAlertWhenThresholdExceeded() {
        stubProfile();
        when(healthProbeService.probe()).thenReturn(new HealthProbeService.HealthSnapshot("UP", "UP", "UP"));
        when(apiErrorMetrics.snapshotAndReset()).thenReturn(new ApiErrorMetrics.Snapshot(100, 3));

        opsAlertService.evaluateAndAlert();

        verify(alertWebhookService).sendText(eq("error-rate"), anyString(), anyString());
    }

    @Test
    void evaluateAndAlert_skipsErrorRateWhenSampleTooSmall() {
        when(healthProbeService.probe()).thenReturn(new HealthProbeService.HealthSnapshot("UP", "UP", "UP"));
        when(apiErrorMetrics.snapshotAndReset()).thenReturn(new ApiErrorMetrics.Snapshot(5, 5));

        opsAlertService.evaluateAndAlert();

        verify(alertWebhookService, never()).sendText(eq("error-rate"), anyString(), anyString());
    }
}
