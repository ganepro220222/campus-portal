package com.shuyuan.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shuyuan.backend.entity.Member;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface MemberMapper extends BaseMapper<Member> {

    /** 原子增加积分余额 */
    @Update("UPDATE member SET points = COALESCE(points, 0) + #{delta} WHERE id = #{memberId}")
    int addPointsDelta(@Param("memberId") Long memberId, @Param("delta") int delta);
}
