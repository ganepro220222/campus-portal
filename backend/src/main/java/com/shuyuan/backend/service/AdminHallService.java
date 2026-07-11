package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.HallMediaItem;
import com.shuyuan.backend.dto.HallSaveRequest;
import com.shuyuan.backend.dto.HallSectionItem;
import com.shuyuan.backend.entity.Hall;
import com.shuyuan.backend.entity.HallMedia;
import com.shuyuan.backend.entity.HallSection;
import com.shuyuan.backend.mapper.HallMapper;
import com.shuyuan.backend.mapper.HallMediaMapper;
import com.shuyuan.backend.mapper.HallSectionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminHallService {

    private final HallMapper hallMapper;
    private final HallMediaMapper hallMediaMapper;
    private final HallSectionMapper hallSectionMapper;
    private final CategoryService categoryService;
    private final AdminPermissionService adminPermissionService;
    private final SearchIndexSyncService searchIndexSyncService;

    public PageResult<Map<String, Object>> list(int page, int size) {
        adminPermissionService.require("hall:read");
        Page<Hall> p = hallMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<Hall>().orderByAsc(Hall::getSort));
        Map<Long, String> catMap = categoryService.nameMap("hall");
        List<Map<String, Object>> records = p.getRecords().stream()
                .map(h -> toVo(h, catMap)).toList();
        return new PageResult<>(records, p.getTotal(), page, size);
    }

    public Map<String, Object> detail(Long id) {
        adminPermissionService.require("hall:read");
        Hall hall = requireHall(id);
        Map<String, Object> vo = toVo(hall, categoryService.nameMap("hall"));
        List<HallMedia> media = hallMediaMapper.selectList(new LambdaQueryWrapper<HallMedia>()
                .eq(HallMedia::getHallId, id)
                .orderByAsc(HallMedia::getSort));
        List<HallSection> sections = hallSectionMapper.selectList(new LambdaQueryWrapper<HallSection>()
                .eq(HallSection::getHallId, id)
                .orderByAsc(HallSection::getSort));

        vo.put("slides", listTopSlides(media));
        vo.put("sections", listSectionPayload(sections, media));
        HallMedia audio = findAudio(media);
        vo.put("audioUrl", audio != null ? audio.getUrl() : null);
        vo.put("audioTime", audio != null ? audio.getCaption() : null);
        return vo;
    }

    @Transactional
    public Map<String, Object> create(HallSaveRequest req) {
        adminPermissionService.require("hall:write");
        validateName(req);
        Hall hall = fromRequest(new Hall(), req);
        if (hall.getSort() == null) {
            hall.setSort(0);
        }
        if (hall.getStatus() == null) {
            hall.setStatus(1);
        }
        hallMapper.insert(hall);
        syncContent(hall.getId(), req);
        Hall saved = hallMapper.selectById(hall.getId());
        if (saved.getStatus() == 1) {
            searchIndexSyncService.syncHall(saved);
        }
        return detail(saved.getId());
    }

    @Transactional
    public Map<String, Object> update(Long id, HallSaveRequest req) {
        adminPermissionService.require("hall:write");
        Hall hall = requireHall(id);
        fromRequest(hall, req);
        hallMapper.updateById(hall);
        syncContent(id, req);
        Hall saved = hallMapper.selectById(id);
        if (saved.getStatus() != null && saved.getStatus() == 1) {
            searchIndexSyncService.syncHall(saved);
        } else {
            searchIndexSyncService.removeHall(id);
        }
        return detail(id);
    }

    @Transactional
    public Map<String, Object> publish(Long id) {
        adminPermissionService.require("hall:publish");
        Hall hall = requireHall(id);
        if (hall.getStatus() != null && hall.getStatus() == 1) {
            throw new BusinessException(400, "展馆已上架");
        }
        hall.setStatus(1);
        hallMapper.updateById(hall);
        Hall saved = hallMapper.selectById(id);
        searchIndexSyncService.syncHall(saved);
        return detail(id);
    }

    @Transactional
    public Map<String, Object> unpublish(Long id) {
        adminPermissionService.require("hall:publish");
        Hall hall = requireHall(id);
        if (hall.getStatus() == null || hall.getStatus() != 1) {
            throw new BusinessException(400, "仅已上架展馆可下架");
        }
        hall.setStatus(0);
        hallMapper.updateById(hall);
        searchIndexSyncService.removeHall(id);
        return detail(id);
    }

    private Hall requireHall(Long id) {
        Hall hall = hallMapper.selectById(id);
        if (hall == null) {
            throw new BusinessException(404, "展馆不存在");
        }
        return hall;
    }

    private void validateName(HallSaveRequest req) {
        if (req.getName() == null || req.getName().isBlank()) {
            throw new BusinessException(400, "展馆名称不能为空");
        }
    }

    private Hall fromRequest(Hall hall, HallSaveRequest req) {
        if (req.getName() != null) {
            hall.setName(req.getName().trim());
        }
        if (req.getShortName() != null) {
            hall.setShortName(req.getShortName().trim());
        }
        if (req.getCover() != null) {
            hall.setCover(req.getCover().trim());
        }
        if (req.getCoverFitMode() != null) {
            hall.setCoverFitMode(com.shuyuan.backend.util.CoverFitMode.normalize(req.getCoverFitMode()));
        }
        if (req.getIntro() != null) {
            hall.setIntro(req.getIntro());
        }
        if (req.getVrUrl() != null) {
            hall.setVrUrl(req.getVrUrl().trim());
        }
        if (req.getCategoryId() != null) {
            hall.setCategoryId(req.getCategoryId());
        }
        if (req.getSort() != null) {
            hall.setSort(req.getSort());
        }
        if (req.getStatus() != null) {
            hall.setStatus(req.getStatus());
        }
        return hall;
    }

    private void syncContent(Long hallId, HallSaveRequest req) {
        if (req.getSlides() == null && req.getSections() == null && req.getAudioUrl() == null) {
            return;
        }

        if (req.getSections() != null) {
            hallSectionMapper.delete(new LambdaQueryWrapper<HallSection>().eq(HallSection::getHallId, hallId));
            hallMediaMapper.delete(new LambdaQueryWrapper<HallMedia>()
                    .eq(HallMedia::getHallId, hallId)
                    .isNotNull(HallMedia::getSectionId));
            int sectionSort = 0;
            for (HallSectionItem sectionItem : req.getSections()) {
                if (sectionItem == null || sectionItem.getTitle() == null || sectionItem.getTitle().isBlank()) {
                    continue;
                }
                HallSection section = new HallSection();
                section.setHallId(hallId);
                section.setTitle(sectionItem.getTitle().trim());
                section.setSort(sectionItem.getSort() != null ? sectionItem.getSort() : sectionSort++);
                hallSectionMapper.insert(section);
                if (sectionItem.getItems() != null) {
                    int itemSort = 0;
                    for (HallMediaItem item : sectionItem.getItems()) {
                        if (item == null || item.getUrl() == null || item.getUrl().isBlank()) {
                            continue;
                        }
                        HallMedia media = new HallMedia();
                        media.setHallId(hallId);
                        media.setSectionId(section.getId());
                        media.setMediaType("image");
                        media.setUrl(item.getUrl().trim());
                        media.setCaption(item.getCaption() != null ? item.getCaption().trim() : null);
                        media.setSort(item.getSort() != null ? item.getSort() : itemSort++);
                        hallMediaMapper.insert(media);
                    }
                }
            }
        }

        if (req.getSlides() != null) {
            hallMediaMapper.delete(new LambdaQueryWrapper<HallMedia>()
                    .eq(HallMedia::getHallId, hallId)
                    .isNull(HallMedia::getSectionId)
                    .eq(HallMedia::getMediaType, "image"));
            int sort = 0;
            for (HallMediaItem item : req.getSlides()) {
                if (item == null || item.getUrl() == null || item.getUrl().isBlank()) {
                    continue;
                }
                HallMedia media = new HallMedia();
                media.setHallId(hallId);
                media.setMediaType("image");
                media.setUrl(item.getUrl().trim());
                media.setCaption(item.getCaption() != null ? item.getCaption().trim() : null);
                media.setSort(item.getSort() != null ? item.getSort() : sort++);
                hallMediaMapper.insert(media);
            }
        }

        if (req.getAudioUrl() != null) {
            hallMediaMapper.delete(new LambdaQueryWrapper<HallMedia>()
                    .eq(HallMedia::getHallId, hallId)
                    .eq(HallMedia::getMediaType, "audio"));
            if (!req.getAudioUrl().isBlank()) {
                HallMedia audio = new HallMedia();
                audio.setHallId(hallId);
                audio.setMediaType("audio");
                audio.setUrl(req.getAudioUrl().trim());
                audio.setCaption(req.getAudioTime() != null && !req.getAudioTime().isBlank()
                        ? req.getAudioTime().trim() : "语音讲解");
                audio.setSort(999);
                hallMediaMapper.insert(audio);
            }
        }
    }

    private List<Map<String, Object>> listTopSlides(List<HallMedia> media) {
        return media.stream()
                .filter(m -> "image".equals(m.getMediaType()) && m.getSectionId() == null)
                .map(m -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("url", m.getUrl());
                    item.put("caption", m.getCaption());
                    item.put("sort", m.getSort());
                    return item;
                }).toList();
    }

    private List<Map<String, Object>> listSectionPayload(List<HallSection> sections, List<HallMedia> media) {
        return HallService.buildSectionViews(sections, media).stream()
                .map(section -> {
                    Map<String, Object> payload = new HashMap<>(section);
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> items = (List<Map<String, Object>>) section.get("items");
                    List<Map<String, Object>> mapped = items.stream().map(item -> {
                        Map<String, Object> row = new HashMap<>();
                        row.put("url", item.get("imageUrl"));
                        row.put("caption", item.get("caption"));
                        return row;
                    }).toList();
                    payload.put("items", mapped);
                    return payload;
                }).toList();
    }

    private HallMedia findAudio(List<HallMedia> media) {
        return media.stream()
                .filter(m -> "audio".equals(m.getMediaType()))
                .findFirst()
                .orElse(null);
    }

    private Map<String, Object> toVo(Hall h, Map<Long, String> catMap) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", h.getId());
        m.put("name", h.getName());
        m.put("shortName", h.getShortName());
        m.put("cover", h.getCover());
        m.put("coverFitMode", com.shuyuan.backend.util.CoverFitMode.normalize(h.getCoverFitMode()));
        m.put("intro", h.getIntro());
        m.put("vrUrl", h.getVrUrl());
        m.put("vrReady", HallService.isVrReady(h.getVrUrl()));
        m.put("categoryId", h.getCategoryId());
        m.put("categoryName", categoryService.getName(h.getCategoryId(), catMap));
        m.put("sort", h.getSort());
        m.put("status", h.getStatus());
        return m;
    }
}
