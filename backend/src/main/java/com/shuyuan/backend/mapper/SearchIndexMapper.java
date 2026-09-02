package com.shuyuan.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shuyuan.backend.entity.SearchIndex;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface SearchIndexMapper extends BaseMapper<SearchIndex> {

    @Update("""
            UPDATE search_index
            SET status = 0
            WHERE status = 1
            """)
    int disableAllEnabled();

    @Insert("""
            <script>
            INSERT INTO search_index
              (target_type, target_id, title, summary, cover, publish_time, status)
            VALUES
            <foreach collection="rows" item="row" separator=",">
              (#{row.targetType}, #{row.targetId}, #{row.title}, #{row.summary},
               #{row.cover}, #{row.publishTime}, 1)
            </foreach>
            ON DUPLICATE KEY UPDATE
              title = VALUES(title),
              summary = VALUES(summary),
              cover = VALUES(cover),
              publish_time = VALUES(publish_time),
              status = 1
            </script>
            """)
    int upsertBatch(@Param("rows") List<SearchIndex> rows);
}
