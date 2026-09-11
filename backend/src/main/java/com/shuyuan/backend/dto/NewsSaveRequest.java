package com.shuyuan.backend.dto;

import lombok.Data;

/**
 * 新闻保存请求。
 *
 * <p>不加 {@code @Size}：管理端标题/封面/摘要已有 maxlength，与库字段一致；
 * 正文走 sanitizer。补 Bean Validation 只挡住直打 API，老师保存路径不变，
 * 还要改写接口 {@code @Valid} 和一批测试。库字段截断仍是最后防线。
 */
@Data
public class NewsSaveRequest {

    private String title;
    private String cover;
    /** fill=裁切填满 fit=完整显示 */
    private String coverFitMode;
    private String summary;
    private String content;
    private Long categoryId;
    private Integer isTop;
}
