package com.shuyuan.backend.common;

import com.shuyuan.backend.common.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 全局异常统一处理
 * 所有 Controller 抛出的异常都会在这里被捕获并返回标准格式
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /** 处理业务异常 */
    @ExceptionHandler(BusinessException.class)
    public Result<Void> handleBusinessException(BusinessException e) {
        return Result.fail(e.getCode(), e.getMessage());
    }

    /** 处理参数校验异常（@Valid 注解触发） */
    @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class})
    public Result<Void> handleValidException(Exception e) {
        String message = "参数校验失败";
        if (e instanceof MethodArgumentNotValidException) {
            MethodArgumentNotValidException ex = (MethodArgumentNotValidException) e;
            if (ex.getBindingResult().getFieldError() != null) {
                message = ex.getBindingResult().getFieldError().getDefaultMessage();
            }
        }
        return Result.fail(400, message);
    }

    /** 接口不存在（常见于后端未重启部署新路由） */
    @ExceptionHandler(NoResourceFoundException.class)
    public Result<Void> handleNoResource(NoResourceFoundException e) {
        log.warn("接口不存在: {}", e.getResourcePath());
        return Result.fail(404, "接口不存在，请确认后端已更新并重启");
    }

    /** 处理其他未预料的异常 */
    @ExceptionHandler(Exception.class)
    public Result<Void> handleException(Exception e) {
        log.error("系统异常", e);
        return Result.fail(500, "服务器内部错误，请稍后重试");
    }
}