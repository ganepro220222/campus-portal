package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.Craft;
import com.shuyuan.backend.entity.CraftContact;
import com.shuyuan.backend.entity.CraftImage;
import com.shuyuan.backend.mapper.CraftContactMapper;
import com.shuyuan.backend.mapper.CraftImageMapper;
import com.shuyuan.backend.mapper.CraftMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CraftService {

    private final CraftMapper craftMapper;
    private final CraftImageMapper craftImageMapper;
    private final CraftContactMapper craftContactMapper;
    private final CategoryService categoryService;

    public List<Map<String, Object>> list(String category) {
        Map<Long, String> catMap = categoryService.nameMap("craft");
        LambdaQueryWrapper<Craft> qw = new LambdaQueryWrapper<Craft>()
                .eq(Craft::getStatus, 1)
                .orderByAsc(Craft::getSort);
        if (category != null && !category.isBlank() && !"全部".equals(category)) {
            Long cid = categoryService.findIdByName("craft", category);
            if (cid != null) {
                qw.eq(Craft::getCategoryId, cid);
            }
        }
        return craftMapper.selectList(qw).stream()
                .map(c -> toListItem(c, catMap))
                .toList();
    }

    public Map<String, Object> detail(Long id) {
        Craft craft = craftMapper.selectById(id);
        if (craft == null || craft.getStatus() == null || craft.getStatus() != 1) {
            throw new BusinessException(404, "文创不存在");
        }
        Map<Long, String> catMap = categoryService.nameMap("craft");

        List<CraftImage> images = craftImageMapper.selectList(new LambdaQueryWrapper<CraftImage>()
                .eq(CraftImage::getCraftId, id)
                .orderByAsc(CraftImage::getSort));

        List<Map<String, Object>> imageList = images.stream().map(img -> {
            Map<String, Object> m = new HashMap<>();
            m.put("imageUrl", img.getImageUrl());
            m.put("angleLabel", img.getAngleLabel());
            return m;
        }).toList();

        CraftContact contact = craftContactMapper.selectById(id);
        Map<String, Object> contactVo = null;
        if (contact != null) {
            contactVo = new HashMap<>();
            contactVo.put("phone", contact.getPhone());
            contactVo.put("wechat", contact.getWechat());
            contactVo.put("workWechat", contact.getWorkWechat());
            contactVo.put("email", contact.getEmail());
        }

        Map<String, Object> m = new HashMap<>();
        m.put("id", craft.getId());
        m.put("name", craft.getName());
        m.put("cover", craft.getCover());
        m.put("introZh", craft.getIntroZh());
        m.put("introEn", craft.getIntroEn());
        m.put("previewType", craft.getPreviewType());
        m.put("model3dUrl", craft.getModel3dUrl());
        m.put("categoryName", categoryService.getName(craft.getCategoryId(), catMap));
        m.put("images", imageList);
        m.put("contact", contactVo);
        return m;
    }

    private Map<String, Object> toListItem(Craft c, Map<Long, String> catMap) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", c.getId());
        m.put("name", c.getName());
        m.put("cover", c.getCover());
        m.put("intro", c.getIntroZh());
        m.put("introZh", c.getIntroZh());
        m.put("categoryName", categoryService.getName(c.getCategoryId(), catMap));
        m.put("previewType", c.getPreviewType());
        return m;
    }
}
