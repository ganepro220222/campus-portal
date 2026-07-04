package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.Hall;
import com.shuyuan.backend.entity.HallMedia;
import com.shuyuan.backend.mapper.HallMapper;
import com.shuyuan.backend.mapper.HallMediaMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class HallService {

    private final HallMapper hallMapper;
    private final HallMediaMapper hallMediaMapper;
    private final CategoryService categoryService;

    public List<Map<String, Object>> list(String category) {
        Map<Long, String> catMap = categoryService.nameMap("hall");
        LambdaQueryWrapper<Hall> qw = new LambdaQueryWrapper<Hall>()
                .eq(Hall::getStatus, 1)
                .orderByAsc(Hall::getSort);
        if (category != null && !category.isBlank() && !"全部".equals(category)) {
            Long cid = categoryService.findIdByName("hall", category);
            if (cid != null) {
                qw.eq(Hall::getCategoryId, cid);
            }
        }
        return hallMapper.selectList(qw).stream()
                .map(h -> toListItem(h, catMap))
                .toList();
    }

    public Map<String, Object> detail(Long id) {
        Hall hall = hallMapper.selectById(id);
        if (hall == null || hall.getStatus() == null || hall.getStatus() != 1) {
            throw new BusinessException(404, "展馆不存在");
        }
        Map<Long, String> catMap = categoryService.nameMap("hall");
        List<HallMedia> media = hallMediaMapper.selectList(new LambdaQueryWrapper<HallMedia>()
                .eq(HallMedia::getHallId, id)
                .orderByAsc(HallMedia::getSort));

        List<Map<String, Object>> slides = media.stream()
                .filter(m -> "image".equals(m.getMediaType()))
                .map(m -> {
                    Map<String, Object> s = new HashMap<>();
                    s.put("imageUrl", m.getUrl());
                    s.put("caption", m.getCaption());
                    return s;
                }).toList();

        String caption = slides.stream()
                .map(s -> (String) s.get("caption"))
                .filter(c -> c != null && !c.isBlank())
                .findFirst()
                .orElse("左右滑动浏览，支持双指放大");

        HallMedia audio = media.stream()
                .filter(m -> "audio".equals(m.getMediaType()))
                .findFirst()
                .orElse(null);

        Map<String, Object> m = new HashMap<>();
        m.put("id", hall.getId());
        m.put("name", hall.getName());
        m.put("cover", hall.getCover());
        m.put("intro", hall.getIntro());
        m.put("cat", categoryService.getName(hall.getCategoryId(), catMap));
        m.put("categoryName", categoryService.getName(hall.getCategoryId(), catMap));
        m.put("slides", slides);
        m.put("caption", caption);
        m.put("audioUrl", audio != null ? audio.getUrl() : null);
        m.put("audioTime", audio != null && audio.getCaption() != null ? audio.getCaption() : "语音讲解");
        return m;
    }

    private Map<String, Object> toListItem(Hall h, Map<Long, String> catMap) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", h.getId());
        m.put("name", h.getName());
        m.put("cover", h.getCover());
        m.put("intro", h.getIntro());
        m.put("desc", h.getIntro());
        m.put("cat", categoryService.getName(h.getCategoryId(), catMap));
        m.put("categoryName", categoryService.getName(h.getCategoryId(), catMap));
        return m;
    }
}
