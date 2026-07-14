package com.shuyuan.backend.dto;

import lombok.Data;

/**
 * 发件箱 JSON 载荷：仅存发送模板所需字段，避免绑定完整实体。
 */
@Data
public class SubscribeOutboxPayload {

    private Long activityId;
    private Long enrollId;
    private String activityTitle;
    /** 格式化后的活动时间，对应模板 time4 */
    private String activityStartTime;
    private String enrollStatus;
    private String voucherCode;
}
