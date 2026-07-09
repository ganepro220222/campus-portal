package com.shuyuan.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shuyuan.backend.entity.MemberSubscribeRecord;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

public interface MemberSubscribeRecordMapper extends BaseMapper<MemberSubscribeRecord> {

    @Update("""
            UPDATE member_subscribe_record
            SET available_count = available_count - 1,
                last_used_at = NOW()
            WHERE id = #{id} AND available_count > 0
            """)
    int decrAvailable(@Param("id") Long id);
}
