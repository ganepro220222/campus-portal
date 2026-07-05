package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
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
        saveContentStats(date, loadLogs(date));
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
        List<EventLog> logs = eventLogMapper.selectList(new LambdaQueryWrapper<EventLog>()
                .eq(EventLog::getEventType, "view")
                .ge(EventLog::getCreatedAt, since)
                .isNotNull(EventLog::getTargetType));

        Map<String, Long> grouped = logs.stream()
                .collect(Collectors.groupingBy(EventLog::getTargetType, Collectors.counting()));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, Long> e : grouped.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .toList()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("module", e.getKey());
            m.put("moduleLabel", moduleLabel(e.getKey()));
            m.put("count", e.getValue());
            result.add(m);
        }
        return result;
    }

    /** 内容浏览排行（近 7 日 view 事件） */
    public List<Map<String, Object>> contentTop(String targetType, int limit) {
        int top = Math.min(Math.max(limit, 1), 50);
        LocalDateTime since = LocalDate.now().minusDays(6).atStartOfDay();
        LambdaQueryWrapper<EventLog> qw = new LambdaQueryWrapper<EventLog>()
                .eq(EventLog::getEventType, "view")
                .ge(EventLog::getCreatedAt, since)
                .isNotNull(EventLog::getTargetType)
                .isNotNull(EventLog::getTargetId);
        if (targetType != null && !targetType.isBlank()) {
            qw.eq(EventLog::getTargetType, targetType.trim());
        }
        List<EventLog> logs = eventLogMapper.selectList(qw);

        Map<String, Long> counter = new HashMap<>();
        for (EventLog log : logs) {
            String key = log.getTargetType() + ":" + log.getTargetId();
            counter.merge(key, 1L, Long::sum);
        }

        return counter.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(top)
                .map(e -> {
                    String[] parts = e.getKey().split(":", 2);
                    String type = parts[0];
                    Long id = Long.parseLong(parts[1]);
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("targetType", type);
                    m.put("targetTypeLabel", moduleLabel(type));
                    m.put("targetId", id);
                    m.put("title", resolveTitle(type, id));
                    m.put("viewCount", e.getValue());
                    return m;
                })
                .toList();
    }

    private StatDaily buildDailyStat(LocalDate date) {
        List<EventLog> logs = loadLogs(date);
        long pv = logs.size();
        long uv = logs.stream()
                .map(EventLog::getMemberId)
                .filter(Objects::nonNull)
                .distinct()
                .count();

        Long redisDau = redis.opsForSet().size(DAU_KEY_PREFIX + date.format(DATE_FMT));
        long dau = Math.max(uv, redisDau != null ? redisDau : 0L);

        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();

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

    private List<EventLog> loadLogs(LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.plusDays(1).atStartOfDay();
        return eventLogMapper.selectList(new LambdaQueryWrapper<EventLog>()
                .ge(EventLog::getCreatedAt, start)
                .lt(EventLog::getCreatedAt, end));
    }

    private void saveContentStats(LocalDate date, List<EventLog> logs) {
        statContentMapper.delete(new LambdaQueryWrapper<StatContent>()
                .eq(StatContent::getDate, date));

        Map<String, Integer> views = new HashMap<>();
        for (EventLog log : logs) {
            if (!"view".equals(log.getEventType()) || log.getTargetType() == null || log.getTargetId() == null) {
                continue;
            }
            String key = log.getTargetType() + ":" + log.getTargetId();
            views.merge(key, 1, Integer::sum);
        }
        for (Map.Entry<String, Integer> e : views.entrySet()) {
            String[] parts = e.getKey().split(":", 2);
            StatContent row = new StatContent();
            row.setDate(date);
            row.setTargetType(parts[0]);
            row.setTargetId(Long.parseLong(parts[1]));
            row.setViewCount(e.getValue());
            row.setClickCount(0);
            statContentMapper.insert(row);
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
            case "news" -> "新闻";
            case "hall" -> "展馆";
            case "craft" -> "文创";
            case "course" -> "课程";
            case "resource" -> "资源";
            case "activity" -> "活动";
            default -> type;
        };
    }

    private String resolveTitle(String type, Long id) {
        if (type == null || id == null) {
            return "";
        }
        return switch (type) {
            case "news" -> {
                News n = newsMapper.selectById(id);
                yield n != null ? n.getTitle() : "";
            }
            case "hall" -> {
                Hall h = hallMapper.selectById(id);
                yield h != null ? h.getName() : "";
            }
            case "craft" -> {
                Craft c = craftMapper.selectById(id);
                yield c != null ? c.getName() : "";
            }
            case "course" -> {
                Course c = courseMapper.selectById(id);
                yield c != null ? c.getName() : "";
            }
            case "resource" -> {
                Resource r = resourceMapper.selectById(id);
                yield r != null ? r.getName() : "";
            }
            case "activity" -> {
                Activity a = activityMapper.selectById(id);
                yield a != null ? a.getTitle() : "";
            }
            default -> "";
        };
    }
}
