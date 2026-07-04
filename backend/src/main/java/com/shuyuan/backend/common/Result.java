package com.shuyuan.backend.common;

import lombok.Data;

/**
 * 统一接口响应格式
 * 所有接口返回值都用这个类包装
 */
@Data
public class Result<T> {

    /** 状态码，200 表示成功 */
    private Integer code;

    /** 提示信息 */
    private String message;

    /** 响应数据 */
    private T data;

    /** 成功，带数据 */
    public static <T> Result<T> ok(T data) {
        Result<T> result = new Result<>();
        result.code = 200;
        result.message = "success";
        result.data = data;
        return result;
    }

    /** 成功，无数据 */
    public static Result<Void> ok() {
        return ok(null);
    }

    /** 失败 */
    public static <T> Result<T> fail(int code, String message) {
        Result<T> result = new Result<>();
        result.code = code;
        result.message = message;
        return result;
    }

    /** 失败，使用默认错误码 500 */
    public static <T> Result<T> fail(String message) {
        return fail(500, message);
    }
}