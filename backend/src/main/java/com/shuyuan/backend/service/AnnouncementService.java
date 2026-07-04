package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.entity.Announcement;
import com.shuyuan.backend.mapper.AnnouncementMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementMapper announcementMapper;

    public List<Map<String, Object>> listActive() {
        LocalDateTime now = LocalDateTime.now();
        List<Announcement> list = announcementMapper.selectList(new LambdaQueryWrapper<Announcement>()
                .eq(Announcement::getStatus, 1)
                .and(w -> w.isNull(Announcement::getStartTime).or().le(Announcement::getStartTime, now))
                .and(w -> w.isNull(Announcement::getEndTime).or().ge(Announcement::getEndTime, now))
                .orderByAsc(Announcement::getSort));
        return list.stream().map(a -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", a.getId());
            m.put("content", a.getContent());
            m.put("linkUrl", a.getLinkUrl());
            return m;
        }).toList();
    }
}
