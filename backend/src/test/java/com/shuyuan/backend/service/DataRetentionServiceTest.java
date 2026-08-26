package com.shuyuan.backend.service;

import com.shuyuan.backend.config.ShuyuanProperties;
import com.shuyuan.backend.mapper.EventLogMapper;
import com.shuyuan.backend.mapper.SubscribeOutboxMapper;
import com.shuyuan.backend.mapper.SysLogMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DataRetentionServiceTest {

    @Mock
    private EventLogMapper eventLogMapper;
    @Mock
    private SysLogMapper sysLogMapper;
    @Mock
    private SubscribeOutboxMapper outboxMapper;

    private ShuyuanProperties properties;
    private DataRetentionService service;

    /** 固定基准时间，断言的是「删除边界正好落在 now-days」这件事，不受运行时刻影响 */
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 8, 26, 3, 30);

    @BeforeEach
    void setUp() {
        properties = new ShuyuanProperties();
        service = new DataRetentionService(eventLogMapper, sysLogMapper, outboxMapper, properties);
    }

    @Test
    void 关闭开关时一行都不删() {
        properties.getRetention().setEnabled(false);
        Map<String, Integer> removed = service.purgeExpired(NOW);
        assertTrue(removed.isEmpty());
        verifyNoInteractions(eventLogMapper, sysLogMapper, outboxMapper);
    }

    @Test
    void 保留天数按各表配置换算成时间边界() {
        properties.getRetention().setEventLogDays(90);
        properties.getRetention().setSysLogDays(365);
        properties.getRetention().setOutboxSentDays(30);
        properties.getRetention().setOutboxFailedDays(180);
        service.purgeExpired(NOW);

        ArgumentCaptor<LocalDateTime> ev = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(eventLogMapper).deleteCreatedBefore(ev.capture(), anyInt());
        assertEquals(NOW.minusDays(90), ev.getValue());

        ArgumentCaptor<LocalDateTime> sys = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(sysLogMapper).deleteCreatedBefore(sys.capture(), anyInt());
        assertEquals(NOW.minusDays(365), sys.getValue());

        ArgumentCaptor<LocalDateTime> sent = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(outboxMapper).deleteByStatusBefore(eq("sent"), sent.capture(), anyInt());
        assertEquals(NOW.minusDays(30), sent.getValue());

        ArgumentCaptor<LocalDateTime> failed = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(outboxMapper).deleteByStatusBefore(eq("failed"), failed.capture(), anyInt());
        assertEquals(NOW.minusDays(180), failed.getValue());
    }

    /** 这是本服务最重要的安全属性：还没投递完的活儿任何时候都不能删 */
    @Test
    void 绝不删除pending与processing() {
        service.purgeExpired(NOW);
        verify(outboxMapper, never()).deleteByStatusBefore(eq("pending"), any(), anyInt());
        verify(outboxMapper, never()).deleteByStatusBefore(eq("processing"), any(), anyInt());
        // 且只碰这三个终态
        verify(outboxMapper, times(1)).deleteByStatusBefore(eq("sent"), any(), anyInt());
        verify(outboxMapper, times(1)).deleteByStatusBefore(eq("failed"), any(), anyInt());
        verify(outboxMapper, times(1)).deleteByStatusBefore(eq("skipped"), any(), anyInt());
    }

    @Test
    void 天数为零或负数表示该表不清理() {
        properties.getRetention().setEventLogDays(0);
        properties.getRetention().setSysLogDays(-1);
        service.purgeExpired(NOW);
        verify(eventLogMapper, never()).deleteCreatedBefore(any(), anyInt());
        verify(sysLogMapper, never()).deleteCreatedBefore(any(), anyInt());
    }

    @Test
    void 删满一整批就继续删不足一批即停() {
        properties.getRetention().setBatchSize(100);
        // 前两批删满，第三批只删到 40 → 追平，共 240，且只调用三次
        when(eventLogMapper.deleteCreatedBefore(any(), eq(100))).thenReturn(100, 100, 40);
        Map<String, Integer> removed = service.purgeExpired(NOW);
        assertEquals(240, removed.get("event_log"));
        verify(eventLogMapper, times(3)).deleteCreatedBefore(any(), eq(100));
    }

    @Test
    void 首批为零时立即停止不做无谓查询() {
        when(eventLogMapper.deleteCreatedBefore(any(), anyInt())).thenReturn(0);
        Map<String, Integer> removed = service.purgeExpired(NOW);
        assertFalse(removed.containsKey("event_log"));
        verify(eventLogMapper, times(1)).deleteCreatedBefore(any(), anyInt());
    }

    /** 存量巨大时不能一轮删到天亮：批次上限到了就收手，剩下的留到下一轮 */
    @Test
    void 单轮批次有上限() {
        properties.getRetention().setBatchSize(10);
        properties.getRetention().setMaxBatchesPerRun(5);
        when(eventLogMapper.deleteCreatedBefore(any(), eq(10))).thenReturn(10);   // 永远删满
        Map<String, Integer> removed = service.purgeExpired(NOW);
        assertEquals(50, removed.get("event_log"));
        verify(eventLogMapper, times(5)).deleteCreatedBefore(any(), eq(10));
    }

    @Test
    void 批量参数非法时回落到安全默认值() {
        assertEquals(DataRetentionService.DEFAULT_BATCH_SIZE, DataRetentionService.normalizeBatchSize(0));
        assertEquals(DataRetentionService.DEFAULT_BATCH_SIZE, DataRetentionService.normalizeBatchSize(-5));
        assertEquals(DataRetentionService.MAX_BATCH_SIZE, DataRetentionService.normalizeBatchSize(999_999));
        assertEquals(500, DataRetentionService.normalizeBatchSize(500));

        assertEquals(DataRetentionService.DEFAULT_MAX_BATCHES, DataRetentionService.normalizeMaxBatches(0));
        assertEquals(DataRetentionService.DEFAULT_MAX_BATCHES, DataRetentionService.normalizeMaxBatches(-1));
        assertEquals(7, DataRetentionService.normalizeMaxBatches(7));
    }

    @Test
    void 默认配置是保守的() {
        ShuyuanProperties.Retention d = new ShuyuanProperties().getRetention();
        assertTrue(d.isEnabled());
        assertEquals(90, d.getEventLogDays());
        assertEquals(365, d.getSysLogDays());
        assertEquals(30, d.getOutboxSentDays());
        assertEquals(180, d.getOutboxFailedDays());
        // 失败记录一定要比成功记录留得久：排查「为什么没收到通知」靠的就是它
        assertTrue(d.getOutboxFailedDays() > d.getOutboxSentDays());
    }
}
