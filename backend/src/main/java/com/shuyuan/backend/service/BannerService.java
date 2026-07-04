package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.entity.Banner;
import com.shuyuan.backend.mapper.BannerMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BannerService {

    private final BannerMapper bannerMapper;

    public List<Map<String, Object>> listActive() {
        List<Banner> list = bannerMapper.selectList(new LambdaQueryWrapper<Banner>()
                .eq(Banner::getStatus, 1)
                .orderByAsc(Banner::getSort));
        return list.stream().map(this::toVo).toList();
    }

    private Map<String, Object> toVo(Banner b) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", b.getId());
        m.put("title", b.getTitle());
        m.put("description", b.getDescription());
        m.put("imageUrl", b.getImageUrl());
        m.put("linkType", b.getLinkType());
        m.put("linkValue", b.getLinkValue());
        return m;
    }
}
