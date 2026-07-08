package com.shuyuan.backend.service;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

/**
 * 内容安全审核（MVP：关键词拦截，二期可接微信/第三方审核）
 */
@Service
public class ContentSafetyService {

    private static final List<String> BLOCKED = List.of(
            "违禁", "暴力", "色情", "赌博", "毒品", "枪支", "恐怖"
    );

    public boolean checkText(String text) {
        if (text == null || text.isBlank()) {
            return false;
        }
        String lower = text.toLowerCase(Locale.ROOT);
        for (String word : BLOCKED) {
            if (lower.contains(word.toLowerCase(Locale.ROOT))) {
                return false;
            }
        }
        return true;
    }
}
