package com.shuyuan.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shuyuan.backend.dto.AdminUsernameOccupancy;
import com.shuyuan.backend.entity.SysUser;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface SysUserMapper extends BaseMapper<SysUser> {

    /** 查登录名占用（含 is_deleted=1），绕开 @TableLogic 自动过滤 */
    @Select("SELECT id, is_deleted AS isDeleted FROM sys_user WHERE username = #{username} LIMIT 1")
    AdminUsernameOccupancy findUsernameOccupancy(@Param("username") String username);
}
