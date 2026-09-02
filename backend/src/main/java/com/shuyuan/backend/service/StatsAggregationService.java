package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.dto.ContentViewAggregate;
import com.shuyuan.backend.dto.StatsDailyAggregate;
import com.shuyuan.backend.entity.*;
import com.shuyuan.backend.mapper.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 从 event_log 与 Redis 聚合每日统计，写入 stat_daily / stat_content
 */
@Service
@RequiredArgsConstructor
public class StatsAggregationService {

    private static final String DAU_KEY_PREFIX = "dau:";
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final EventLogMapper eventLogMapper;
    private final MemberMapper memberMapper;
    private final EnrollMapper enrollMapper;
    private final StatDailyMapper statDailyMapper;
    private final StatContentMapper statContentMapper;
    private final StringRedisTemplate redis;
    private final NewsMapper newsMapper;
    private final HallMapper hallMapper;
    private final CraftMapper craftMapper;
    private final CourseMapper courseMapper;
    private final ResourceMapper resourceMapper;
    private final ActivityMapper activityMapper;

    /** 聚合指定日期并落库（定时任务调用） */
    @Transactional
    public void aggregateAndSave(LocalDate date) {
        StatDaily daily = buildDailyStat(date);
        StatDaily existing = statDailyMapper.selectById(date);
        if (existing != null) {
            statDailyMapper.updateById(daily);
        } else {
            statDailyMapper.insert(daily);
        }
        saveContentStats(date);
        if (date.isBefore(LocalDate.now())) {
            redis.delete(DAU_KEY_PREFIX + date.format(DATE_FMT));
        }
    }

    /** 实时计算某日概览（今日看板用） */
    public Map<String, Object> snapshotForDate(LocalDate date) {
        StatDaily cached = statDailyMapper.selectById(date);
        if (cached != null && date.isBefore(LocalDate.now())) {
            return toOverviewMap(cached);
        }
        return toOverviewMap(buildDailyStat(date));
    }

    /** 近 N 日趋势（含今日实时） */
    public List<Map<String, Object>> trend(int days) {
        int span = Math.min(Math.max(days, 1), 90);
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(span - 1L);

        List<StatDaily> stored = statDailyMapper.selectList(new LambdaQueryWrapper<StatDaily>()
                .ge(StatDaily::getDate, start)
                .lt(StatDaily::getDate, end)
                .orderByAsc(StatDaily::getDate));

        Map<LocalDate, StatDaily> map = stored.stream()
                .collect(Collectors.toMap(StatDaily::getDate, s -> s, (a, b) -> a));

        List<Map<String, Object>> result = new ArrayList<>();
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            StatDaily row = map.get(d);
            if (row == null || d.equals(end)) {
                row = buildDailyStat(d);
            }
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("date", d.format(DATE_FMT));
            item.put("pv", row.getPv());
            item.put("uv", row.getUv());
            item.put("dau", row.getDau());
            item.put("newMember", row.getNewMember());
            item.put("enrollCount", row.getEnrollCount());
            result.add(item);
        }
        return result;
    }

    /** 各内容模块访问量（近 7 日 view 事件按 target_type 汇总） */
    public List<Map<String, Object>> moduleDistribution(int days) {
        int span = Math.min(Math.max(days, 1), 30);
        LocalDateTime since = LocalDate.now().minusDays(span - 1L).atStartOfDay();
        List<Map<String, Object>> result = new ArrayList<>();
        for (ContentViewAggregate row : eventLogMapper.aggregateModuleViews(since)) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("module", row.getTargetType());
            m.put("moduleLabel", moduleLabel(row.getTargetType()));
            m.put("count", valueOrZero(row.getViewCount()));
            result.add(m);
        }
        return result;
    }

    /** 内容浏览排行（近 7 日 view 事件） */
    public List<Map<String, Object>> contentTop(String targetType, int limit) {
        int top = Math.min(Math.max(limit, 1), 50);
        LocalDateTime since = LocalDate.now().minusDays(6).atStartOfDay();
        String typeFilter = targetType == null || targetType.isBlank() ? null : targetType.trim();
        List<ContentViewAggregate> rows = eventLogMapper.aggregateTopViews(since, typeFilter, top);
        Map<String, String> titles = loadTitles(rows);

        return rows.stream()
                .map(row -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("targetType", row.getTargetType());
                    m.put("targetTypeLabel", moduleLabel(row.getTargetType()));
                    m.put("targetId", row.getTargetId());
                    m.put("title", titles.getOrDefault(
                            indexKey(row.getTargetType(), row.getTargetId()), ""));
                    m.put("viewCount", valueOrZero(row.getViewCount()));
                    return m;
                })
                .toList();
    }

    private StatDaily buildDailyStat(LocalDate date) {
        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();
        StatsDailyAggregate aggregate = eventLogMapper.aggregateDaily(dayStart, dayEnd);
        long pv = aggregate == null ? 0L : valueOrZero(aggregate.getPv());
        long uv = aggregate == null ? 0L : valueOrZero(aggregate.getUv());

        Long redisDau = redis.opsForSet().size(DAU_KEY_PREFIX + date.format(DATE_FMT));
        long dau = Math.max(uv, redisDau != null ? redisDau : 0L);

        long newMember = memberMapper.selectCount(new LambdaQueryWrapper<Member>()
                .ge(Member::getCreateTime, dayStart)
                .lt(Member::getCreateTime, dayEnd));

        long enrollCount = enrollMapper.selectCount(new LambdaQueryWrapper<Enroll>()
                .ge(Enroll::getCreateTime, dayStart)
                .lt(Enroll::getCreateTime, dayEnd)
                .ne(Enroll::getStatus, "cancelled"));

        StatDaily daily = new StatDaily();
        daily.setDate(date);
        daily.setPv(pv);
        daily.setUv(uv);
        daily.setDau(dau);
        daily.setNewMember((int) newMember);
        daily.setEnrollCount((int) enrollCount);
        return daily;
    }

    private void saveContentStats(LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.plusDays(1).atStartOfDay();
        statContentMapper.delete(new LambdaQueryWrapper<StatContent>()
                .eq(StatContent::getDate, date));

        List<StatContent> contentRows = new ArrayList<>();
        for (ContentViewAggregate aggregate : eventLogMapper.aggregateContentViews(start, end)) {
            StatContent row = new StatContent();
            row.setDate(date);
            row.setTargetType(aggregate.getTargetType());
            row.setTargetId(aggregate.getTargetId());
            row.setViewCount(Math.toIntExact(valueOrZero(aggregate.getViewCount())));
            row.setClickCount(0);
            contentRows.add(row);
        }
        if (!contentRows.isEmpty()) {
            statContentMapper.insert(contentRows, 200);
        }
    }

    private Map<String, Object> toOverviewMap(StatDaily daily) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("date", daily.getDate().format(DATE_FMT));
        m.put("pv", daily.getPv());
        m.put("uv", daily.getUv());
        m.put("dau", daily.getDau());
        m.put("newMember", daily.getNewMember());
        m.put("enrollCount", daily.getEnrollCount());
        return m;
    }

    private String moduleLabel(String type) {
        if (type == null) {
            return "";
        }
        return switch (type) {
            case "news" -> "动态";
            case "hall" -> "展馆";
            case "craft" -> "文创";
            case "course" -> "课程";
            case "resource" -> "资源";
            case "activity" -> "活动";
            default -> type;
        };
    }

    private Map<String, String> loadTitles(List<ContentViewAggregate> rows) {
        Map<String, Set<Long>> idsByType = new HashMap<>();
        for (ContentViewAggregate row : rows) {
            if (row.getTargetType() != null && row.getTargetId() != null) {
                idsByType.computeIfAbsent(row.getTargetType(), ignored -> new LinkedHashSet<>())
                        .add(row.getTargetId());
            }
        }

        Map<String, String> titles = new HashMap<>();
        for (Map.Entry<String, Set<Long>> entry : idsByType.entrySet()) {
            String type = entry.getKey();
            Set<Long> ids = entry.getValue();
            switch (type) {
                case "news" -> newsMapper.selectBatchIds(ids)
                        .forEach(row -> titles.put(indexKey(type, row.getId()), textOrEmpty(row.getTitle())));
                case "hall" -> hallMapper.selectBatchIds(ids)
                        .forEach(row -> titles.put(indexKey(type, row.getId()), textOrEmpty(row.getName())));
                case "craft" -> craftMapper.selectBatchIds(ids)
                        .forEach(row -> titles.put(indexKey(type, row.getId()), textOrEmpty(row.getName())));
                case "course" -> courseMapper.selectBatchIds(ids)
                        .forEach(row -> titles.put(indexKey(type, row.getId()), textOrEmpty(row.getName())));
                case "resource" -> resourceMapper.selectBatchIds(ids)
                        .forEach(row -> titles.put(indexKey(type, row.getId()), textOrEmpty(row.getName())));
                case "activity" -> activityMapper.selectBatchIds(ids)
                        .forEach(row -> titles.put(indexKey(type, row.getId()), textOrEmpty(row.getTitle())));
                default -> {
                    // 未知事件类型保留空标题，与旧实现一致。
                }
            }
        }
        return titles;
    }

    private static String indexKey(String type, Long id) {
        return type + ":" + id;
    }

    private static long valueOrZero(Long value) {
        return value == null ? 0L : value;
    }

    private static String textOrEmpty(String value) {
        return value == null ? "" : value;
    }
}
