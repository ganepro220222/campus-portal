package com.shuyuan.backend.common.exception;

import lombok.Getter;

/**
 * 业务异常
 * 主动抛出此异常时，全局处理器会将其转为对应的错误响应
 */
@Getter
public class BusinessException extends RuntimeException {

    /** 错误码 */
    private final int code;

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }

    /** 使用默认错误码 400 */
    public BusinessException(String message) {
        this(400, message);
    }
}