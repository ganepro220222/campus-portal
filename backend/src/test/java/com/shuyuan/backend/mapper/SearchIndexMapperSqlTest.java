package com.shuyuan.backend.mapper;

import com.shuyuan.backend.entity.SearchIndex;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Update;
import org.apache.ibatis.mapping.BoundSql;
import org.apache.ibatis.mapping.SqlSource;
import org.apache.ibatis.scripting.xmltags.XMLLanguageDriver;
import org.apache.ibatis.session.Configuration;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertTrue;

class SearchIndexMapperSqlTest {

    @Test
    void fullRefreshUsesSetBasedDisableAndBatchUpsert() throws Exception {
        String disableSql = String.join(" ", SearchIndexMapper.class
                .getMethod("disableAllEnabled")
                .getAnnotation(Update.class).value()).toLowerCase();
        String upsertSql = String.join(" ", SearchIndexMapper.class
                .getMethod("upsertBatch", List.class)
                .getAnnotation(Insert.class).value()).toLowerCase();

        assertTrue(disableSql.contains("update search_index"));
        assertTrue(disableSql.contains("where status = 1"));
        assertTrue(upsertSql.contains("<foreach"));
        assertTrue(upsertSql.contains("on duplicate key update"));
        assertTrue(upsertSql.contains("status = 1"));
    }

    @Test
    void batchUpsertDynamicScriptExpandsEveryRow() throws Exception {
        String script = String.join(" ", SearchIndexMapper.class
                .getMethod("upsertBatch", List.class)
                .getAnnotation(Insert.class).value());
        SqlSource source = new XMLLanguageDriver().createSqlSource(
                new Configuration(), script, Map.class);
        SearchIndex first = row("news", 1L);
        SearchIndex second = row("hall", 2L);

        BoundSql sql = source.getBoundSql(Map.of("rows", List.of(first, second)));

        assertTrue(sql.getSql().contains("ON DUPLICATE KEY UPDATE"));
        assertTrue(sql.getParameterMappings().size() >= 12);
    }

    private static SearchIndex row(String type, Long id) {
        SearchIndex row = new SearchIndex();
        row.setTargetType(type);
        row.setTargetId(id);
        row.setTitle(type + id);
        return row;
    }
}
