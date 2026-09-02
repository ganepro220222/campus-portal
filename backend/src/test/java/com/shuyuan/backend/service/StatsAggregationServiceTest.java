package com.shuyuan.backend.service;

import com.shuyuan.backend.dto.ContentViewAggregate;
import com.shuyuan.backend.dto.StatsDailyAggregate;
import com.shuyuan.backend.entity.Hall;
import com.shuyuan.backend.entity.News;
import com.shuyuan.backend.entity.StatContent;
import com.shuyuan.backend.entity.StatDaily;
import com.shuyuan.backend.mapper.ActivityMapper;
import com.shuyuan.backend.mapper.CourseMapper;
import com.shuyuan.backend.mapper.CraftMapper;
import com.shuyuan.backend.mapper.EnrollMapper;
import com.shuyuan.backend.mapper.EventLogMapper;
import com.shuyuan.backend.mapper.HallMapper;
import com.shuyuan.backend.mapper.MemberMapper;
import com.shuyuan.backend.mapper.NewsMapper;
import com.shuyuan.backend.mapper.ResourceMapper;
import com.shuyuan.backend.mapper.StatContentMapper;
import com.shuyuan.backend.mapper.StatDailyMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StatsAggregationServiceTest {

    @Mock private EventLogMapper eventLogMapper;
    @Mock private MemberMapper memberMapper;
    @Mock private EnrollMapper enrollMapper;
    @Mock private StatDailyMapper statDailyMapper;
    @Mock private StatContentMapper statContentMapper;
    @Mock private StringRedisTemplate redis;
    @Mock private SetOperations<String, String> setOperations;
    @Mock private NewsMapper newsMapper;
    @Mock private HallMapper hallMapper;
    @Mock private CraftMapper craftMapper;
    @Mock private CourseMapper courseMapper;
    @Mock private ResourceMapper resourceMapper;
    @Mock private ActivityMapper activityMapper;

    @InjectMocks
    private StatsAggregationService service;

    @Test
    void snapshotForDate_usesDatabaseAggregatesAndPreservesDauSemantics() {
        LocalDate date = LocalDate.of(2026, 9, 2);
        when(eventLogMapper.aggregateDaily(date.atStartOfDay(), date.plusDays(1).atStartOfDay()))
                .thenReturn(dailyAggregate(12L, 4L));
        when(redis.opsForSet()).thenReturn(setOperations);
        when(setOperations.size("dau:2026-09-02")).thenReturn(6L);
        when(memberMapper.selectCount(any())).thenReturn(2L);
        when(enrollMapper.selectCount(any())).thenReturn(3L);

        Map<String, Object> result = service.snapshotForDate(date);

        assertEquals(12L, result.get("pv"));
        assertEquals(4L, result.get("uv"));
        assertEquals(6L, result.get("dau"));
        assertEquals(2, result.get("newMember"));
        assertEquals(3, result.get("enrollCount"));
        verify(eventLogMapper, never()).selectList(any());
    }

    @Test
    void aggregateAndSave_groupsContentInSqlAndBatchInsertsRows() {
        LocalDate date = LocalDate.of(2026, 9, 1);
        when(eventLogMapper.aggregateDaily(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(dailyAggregate(20L, 7L));
        when(redis.opsForSet()).thenReturn(setOperations);
        when(eventLogMapper.aggregateContentViews(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(
                        contentAggregate("news", 1L, 8L),
                        contentAggregate("hall", 2L, 5L)));

        service.aggregateAndSave(date);

        verify(statDailyMapper).insert(any(StatDaily.class));
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Collection<StatContent>> rows = ArgumentCaptor.forClass(Collection.class);
        verify(statContentMapper).insert(rows.capture(), eq(200));
        assertEquals(2, rows.getValue().size());
        assertEquals(8, rows.getValue().iterator().next().getViewCount());
        verify(eventLogMapper, never()).selectList(any());
    }

    @Test
    void moduleDistribution_usesGroupedRowsReturnedByMapper() {
        when(eventLogMapper.aggregateModuleViews(any(LocalDateTime.class))).thenReturn(List.of(
                contentAggregate("news", null, 10L),
                contentAggregate("course", null, 6L)));

        List<Map<String, Object>> result = service.moduleDistribution(7);

        assertEquals(List.of("news", "course"),
                result.stream().map(row -> row.get("module")).toList());
        assertEquals("动态", result.get(0).get("moduleLabel"));
        assertEquals(10L, result.get(0).get("count"));
    }

    @Test
    void contentTop_resolvesTitlesWithOneBatchQueryPerType() {
        when(eventLogMapper.aggregateTopViews(any(LocalDateTime.class), eq(null), eq(10)))
                .thenReturn(List.of(
                        contentAggregate("news", 1L, 9L),
                        contentAggregate("hall", 2L, 7L)));
        News news = new News();
        news.setId(1L);
        news.setTitle("动态标题");
        Hall hall = new Hall();
        hall.setId(2L);
        hall.setName("展馆标题");
        when(newsMapper.selectBatchIds(any(Collection.class))).thenReturn(List.of(news));
        when(hallMapper.selectBatchIds(any(Collection.class))).thenReturn(List.of(hall));

        List<Map<String, Object>> result = service.contentTop(null, 10);

        assertEquals("动态标题", result.get(0).get("title"));
        assertEquals("展馆标题", result.get(1).get("title"));
        verify(newsMapper, never()).selectById(any());
        verify(hallMapper, never()).selectById(any());
    }

    @Test
    void trend_reusesStoredHistoryAndAggregatesOnlyToday() {
        LocalDate today = LocalDate.now();
        StatDaily yesterday = new StatDaily();
        yesterday.setDate(today.minusDays(1));
        yesterday.setPv(30L);
        yesterday.setUv(10L);
        yesterday.setDau(11L);
        yesterday.setNewMember(2);
        yesterday.setEnrollCount(1);
        when(statDailyMapper.selectList(any())).thenReturn(List.of(yesterday));
        when(eventLogMapper.aggregateDaily(today.atStartOfDay(), today.plusDays(1).atStartOfDay()))
                .thenReturn(dailyAggregate(8L, 3L));
        when(redis.opsForSet()).thenReturn(setOperations);

        List<Map<String, Object>> result = service.trend(2);

        assertEquals(30L, result.get(0).get("pv"));
        assertEquals(8L, result.get(1).get("pv"));
        verify(eventLogMapper).aggregateDaily(
                today.atStartOfDay(), today.plusDays(1).atStartOfDay());
    }

    private static StatsDailyAggregate dailyAggregate(long pv, long uv) {
        StatsDailyAggregate result = new StatsDailyAggregate();
        result.setPv(pv);
        result.setUv(uv);
        return result;
    }

    private static ContentViewAggregate contentAggregate(
            String targetType, Long targetId, long viewCount) {
        ContentViewAggregate result = new ContentViewAggregate();
        result.setTargetType(targetType);
        result.setTargetId(targetId);
        result.setViewCount(viewCount);
        return result;
    }
}
