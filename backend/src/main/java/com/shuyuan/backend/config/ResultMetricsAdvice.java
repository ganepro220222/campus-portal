package com.shuyuan.backend.config;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.service.ApiErrorMetrics;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

/**
 * 统计 API 统一响应中的业务状态码，供 5xx 错误率告警使用。
 */
@ControllerAdvice
@RequiredArgsConstructor
public class ResultMetricsAdvice implements ResponseBodyAdvice<Result<?>> {

    private final ApiErrorMetrics apiErrorMetrics;

    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
        return Result.class.isAssignableFrom(returnType.getParameterType());
    }

    @Override
    public Result<?> beforeBodyWrite(Result<?> body, MethodParameter returnType, MediaType selectedContentType,
                                     Class<? extends HttpMessageConverter<?>> selectedConverterType,
                                     ServerHttpRequest request, ServerHttpResponse response) {
        if (body == null) {
            return null;
        }
        if (request instanceof ServletServerHttpRequest servletRequest) {
            HttpServletRequest raw = servletRequest.getServletRequest();
            String uri = raw.getRequestURI();
            if (uri != null && uri.startsWith("/api/") && !isExcluded(uri)) {
                apiErrorMetrics.recordResultCode(body.getCode());
            }
        }
        return body;
    }

    private boolean isExcluded(String uri) {
        return uri.startsWith("/api/v1/health")
                || uri.startsWith("/v3/api-docs")
                || uri.startsWith("/swagger-ui");
    }
}
