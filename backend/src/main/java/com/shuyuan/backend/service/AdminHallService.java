package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.HallMediaItem;
import com.shuyuan.backend.dto.HallSaveRequest;
import com.shuyuan.backend.entity.Hall;
import com.shuyuan.backend.entity.HallMedia;
import com.shuyuan.backend.mapper.HallMapper;
import com.shuyuan.backend.mapper.HallMediaMapper;
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
        vo.put("slides", listImageMedia(id));
        HallMedia audio = findAudio(id);
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
        syncMedia(hall.getId(), req);
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
        syncMedia(id, req);
        Hall saved = hallMapper.selectById(id);
        if (saved.getStatus() != null && saved.getStatus() == 1) {
            searchIndexSyncService.syncHall(saved);
        } else {
            searchIndexSyncService.removeHall(id);
        }
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

    private void syncMedia(Long hallId, HallSaveRequest req) {
        if (req.getSlides() == null && req.getAudioUrl() == null) {
            return;
        }
        hallMediaMapper.delete(new LambdaQueryWrapper<HallMedia>()
                .eq(HallMedia::getHallId, hallId));

        if (req.getSlides() != null) {
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

        if (req.getAudioUrl() != null && !req.getAudioUrl().isBlank()) {
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

    private List<Map<String, Object>> listImageMedia(Long hallId) {
        return hallMediaMapper.selectList(new LambdaQueryWrapper<HallMedia>()
                        .eq(HallMedia::getHallId, hallId)
                        .eq(HallMedia::getMediaType, "image")
                        .orderByAsc(HallMedia::getSort))
                .stream()
                .map(m -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("url", m.getUrl());
                    item.put("caption", m.getCaption());
                    item.put("sort", m.getSort());
                    return item;
                }).toList();
    }

    private HallMedia findAudio(Long hallId) {
        return hallMediaMapper.selectList(new LambdaQueryWrapper<HallMedia>()
                        .eq(HallMedia::getHallId, hallId)
                        .eq(HallMedia::getMediaType, "audio")
                        .orderByAsc(HallMedia::getSort))
                .stream()
                .findFirst()
                .orElse(null);
    }

    private Map<String, Object> toVo(Hall h, Map<Long, String> catMap) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", h.getId());
        m.put("name", h.getName());
        m.put("shortName", h.getShortName());
        m.put("cover", h.getCover());
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
