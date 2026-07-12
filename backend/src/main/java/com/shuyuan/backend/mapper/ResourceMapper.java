package com.shuyuan.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shuyuan.backend.entity.Resource;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface ResourceMapper extends BaseMapper<Resource> {

    /** 原子递增下载次数 */
    @Update("UPDATE resource SET download_count = download_count + 1 "
            + "WHERE id = #{id} AND status = 1 AND is_deleted = 0")
    int incrDownloadCount(@Param("id") Long id);
}
