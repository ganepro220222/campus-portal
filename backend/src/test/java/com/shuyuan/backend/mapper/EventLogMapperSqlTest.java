package com.shuyuan.backend.mapper;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.mapping.BoundSql;
import org.apache.ibatis.mapping.SqlSource;
import org.apache.ibatis.scripting.xmltags.XMLLanguageDriver;
import org.apache.ibatis.session.Configuration;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EventLogMapperSqlTest {

    @Test
    void statsQueriesAggregateInDatabaseInsteadOfSelectingEventRows() throws Exception {
        assertAggregateSql("aggregateDaily", LocalDateTime.class, LocalDateTime.class);
        assertAggregateSql("aggregateModuleViews", LocalDateTime.class);
        assertAggregateSql("aggregateContentViews", LocalDateTime.class, LocalDateTime.class);
        assertAggregateSql("aggregateTopViews", LocalDateTime.class, String.class, int.class);
    }

    @Test
    void retentionDeleteOnlyRemovesDatesWithSavedDailyStats() throws Exception {
        Method method = EventLogMapper.class.getMethod(
                "deleteCreatedBefore", LocalDateTime.class, int.class);
        String sql = String.join(" ", method.getAnnotation(Delete.class).value()).toLowerCase();

        assertTrue(sql.contains("exists"));
        assertTrue(sql.contains("stat_daily"));
        assertTrue(sql.contains("date(event_log.created_at)"));
        assertTrue(sql.contains("limit #{limit}"));
    }

    @Test
    void topQueryDynamicScriptBuildsForFilteredAndUnfilteredRequests() throws Exception {
        String script = String.join(" ", EventLogMapper.class
                .getMethod("aggregateTopViews", LocalDateTime.class, String.class, int.class)
                .getAnnotation(Select.class).value());
        SqlSource source = new XMLLanguageDriver().createSqlSource(
                new Configuration(), script, Map.class);

        BoundSql unfiltered = source.getBoundSql(Map.of(
                "since", LocalDateTime.of(2026, 9, 1, 0, 0),
                "limit", 10));
        BoundSql filtered = source.getBoundSql(Map.of(
                "since", LocalDateTime.of(2026, 9, 1, 0, 0),
                "targetType", "news",
                "limit", 10));

        assertFalse(unfiltered.getSql().contains("target_type = ?"));
        assertTrue(filtered.getSql().contains("target_type = ?"));
    }

    private static void assertAggregateSql(String methodName, Class<?>... parameterTypes)
            throws Exception {
        Method method = EventLogMapper.class.getMethod(methodName, parameterTypes);
        String sql = String.join(" ", method.getAnnotation(Select.class).value()).toLowerCase();

        assertTrue(sql.contains("count("), methodName + " 必须在 SQL 中聚合");
        assertFalse(sql.contains("select *"), methodName + " 不得重新拉取 event_log 明细");
        if (!"aggregateDaily".equals(methodName)) {
            assertTrue(sql.contains("group by"), methodName + " 必须在 SQL 中分组");
        }
    }
}
