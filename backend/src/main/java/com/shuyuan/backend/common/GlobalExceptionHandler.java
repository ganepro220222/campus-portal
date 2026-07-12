package com.shuyuan.backend.common;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.service.ApiErrorMetrics;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 全局异常统一处理
 * HTTP 状态码与 body.code 对齐，便于网关/APM；前端仍可按 body.code 分支。
 */
@Slf4j
@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private final ApiErrorMetrics apiErrorMetrics;

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Result<Void>> handleBusinessException(BusinessException e) {
        recordApiCode(e.getCode());
        return ApiHttpStatus.fail(e.getCode(), e.getMessage());
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class})
    public ResponseEntity<Result<Void>> handleValidException(Exception e) {
        String message = "参数校验失败";
        if (e instanceof MethodArgumentNotValidException ex
                && ex.getBindingResult().getFieldError() != null) {
            message = ex.getBindingResult().getFieldError().getDefaultMessage();
        }
        recordApiCode(400);
        return ApiHttpStatus.fail(400, message);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Result<Void>> handleNoResource(NoResourceFoundException e) {
        log.warn("接口不存在: {}", e.getResourcePath());
        recordApiCode(404);
        return ApiHttpStatus.fail(404, "接口不存在，请确认后端已更新并重启");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Result<Void>> handleException(Exception e) {
        log.error("系统异常", e);
        recordApiCode(500);
        return ApiHttpStatus.fail(500, "服务器内部错误，请稍后重试");
    }

    private void recordApiCode(int code) {
        apiErrorMetrics.recordResultCode(code);
    }
}
