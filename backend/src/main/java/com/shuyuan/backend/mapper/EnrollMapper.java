package com.shuyuan.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shuyuan.backend.entity.Enroll;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface EnrollMapper extends BaseMapper<Enroll> {

    @Update("UPDATE enroll SET status = 'approved' "
            + "WHERE id = #{id} AND status = 'pending' AND is_deleted = 0")
    int casApprove(@Param("id") Long id);

    @Update("UPDATE enroll SET status = 'rejected', reject_reason = #{reason} "
            + "WHERE id = #{id} AND status IN ('pending','approved') AND is_deleted = 0")
    int casReject(@Param("id") Long id, @Param("reason") String reason);

    @Update("UPDATE enroll SET status = 'cancelled' "
            + "WHERE id = #{id} AND status IN ('pending','approved') AND is_deleted = 0")
    int casCancelActive(@Param("id") Long id);
}
