package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.Hall;
import com.shuyuan.backend.entity.HallMedia;
import com.shuyuan.backend.entity.HallSection;
import com.shuyuan.backend.mapper.HallMapper;
import com.shuyuan.backend.mapper.HallMediaMapper;
import com.shuyuan.backend.mapper.HallSectionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HallService {

    private final HallMapper hallMapper;
    private final HallMediaMapper hallMediaMapper;
    private final HallSectionMapper hallSectionMapper;
    private final CategoryService categoryService;
    private final EventLogService eventLogService;
    private final PointService pointService;

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
        List<HallSection> sections = hallSectionMapper.selectList(new LambdaQueryWrapper<HallSection>()
                .eq(HallSection::getHallId, id)
                .orderByAsc(HallSection::getSort));

        List<Map<String, Object>> slides = media.stream()
                .filter(m -> "image".equals(m.getMediaType()) && m.getSectionId() == null)
                .map(HallService::toSlideItem)
                .toList();

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
        m.put("shortName", resolveShortName(hall));
        m.put("cover", hall.getCover());
        m.put("coverFitMode", com.shuyuan.backend.util.CoverFitMode.normalize(hall.getCoverFitMode()));
        m.put("intro", hall.getIntro());
        m.put("vrUrl", hall.getVrUrl());
        m.put("vrReady", isVrReady(hall.getVrUrl()));
        m.put("cat", categoryService.getName(hall.getCategoryId(), catMap));
        m.put("categoryName", categoryService.getName(hall.getCategoryId(), catMap));
        m.put("slides", slides);
        m.put("sections", buildSectionViews(sections, media));
        m.put("caption", caption);
        m.put("audioUrl", audio != null ? audio.getUrl() : null);
        m.put("audioTime", audio != null && audio.getCaption() != null ? audio.getCaption() : "语音讲解");
        eventLogService.record("view", "hall", id);
        pointService.awardCurrentUser("view_hall");
        return m;
    }

    static List<Map<String, Object>> buildSectionViews(List<HallSection> sections, List<HallMedia> media) {
        if (sections == null || sections.isEmpty()) {
            return List.of();
        }
        Map<Long, List<HallMedia>> bySection = media.stream()
                .filter(m -> "image".equals(m.getMediaType()) && m.getSectionId() != null)
                .collect(Collectors.groupingBy(HallMedia::getSectionId));

        List<Map<String, Object>> result = new ArrayList<>();
        for (HallSection section : sections) {
            List<Map<String, Object>> items = bySection.getOrDefault(section.getId(), List.of()).stream()
                    .sorted((a, b) -> Integer.compare(
                            a.getSort() != null ? a.getSort() : 0,
                            b.getSort() != null ? b.getSort() : 0))
                    .map(m -> {
                        Map<String, Object> item = new HashMap<>();
                        item.put("imageUrl", m.getUrl());
                        item.put("caption", m.getCaption());
                        return item;
                    }).toList();
            Map<String, Object> vo = new HashMap<>();
            vo.put("id", section.getId());
            vo.put("title", section.getTitle());
            vo.put("sort", section.getSort());
            vo.put("items", items);
            result.add(vo);
        }
        return result;
    }

    static Map<String, Object> toSlideItem(HallMedia m) {
        Map<String, Object> s = new HashMap<>();
        s.put("imageUrl", m.getUrl());
        s.put("caption", m.getCaption());
        return s;
    }

    static String resolveShortName(Hall hall) {
        if (hall == null) {
            return "";
        }
        if (hall.getShortName() != null && !hall.getShortName().isBlank()) {
            return hall.getShortName().trim();
        }
        String name = hall.getName() != null ? hall.getName().trim() : "";
        if (name.length() <= 8) {
            return name;
        }
        return name.replaceAll("馆$", "");
    }

    static boolean isVrReady(String vrUrl) {
        return vrUrl != null && !vrUrl.isBlank() && vrUrl.trim().startsWith("https://");
    }

    private Map<String, Object> toListItem(Hall h, Map<Long, String> catMap) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", h.getId());
        m.put("name", h.getName());
        m.put("shortName", resolveShortName(h));
        m.put("cover", h.getCover());
        m.put("coverFitMode", com.shuyuan.backend.util.CoverFitMode.normalize(h.getCoverFitMode()));
        m.put("intro", h.getIntro());
        m.put("desc", h.getIntro());
        m.put("vrUrl", h.getVrUrl());
        m.put("vrReady", isVrReady(h.getVrUrl()));
        m.put("cat", categoryService.getName(h.getCategoryId(), catMap));
        m.put("categoryName", categoryService.getName(h.getCategoryId(), catMap));
        return m;
    }
}
