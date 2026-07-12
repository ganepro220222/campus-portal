package com.shuyuan.backend.common;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * 业务 code 与 HTTP 状态码对齐，便于网关/监控识别；响应体仍保留 body.code 供前端使用。
 */
public final class ApiHttpStatus {

    private ApiHttpStatus() {
    }

    public static HttpStatus fromBusinessCode(int code) {
        return switch (code) {
            case 400 -> HttpStatus.BAD_REQUEST;
            case 401 -> HttpStatus.UNAUTHORIZED;
            case 403 -> HttpStatus.FORBIDDEN;
            case 404 -> HttpStatus.NOT_FOUND;
            case 429 -> HttpStatus.TOO_MANY_REQUESTS;
            case 500 -> HttpStatus.INTERNAL_SERVER_ERROR;
            default -> {
                if (code >= 400 && code < 500) {
                    HttpStatus resolved = HttpStatus.resolve(code);
                    yield resolved != null ? resolved : HttpStatus.BAD_REQUEST;
                }
                if (code >= 500) {
                    HttpStatus resolved = HttpStatus.resolve(code);
                    yield resolved != null ? resolved : HttpStatus.INTERNAL_SERVER_ERROR;
                }
                yield HttpStatus.OK;
            }
        };
    }

    public static <T> ResponseEntity<Result<T>> fail(int code, String message) {
        return ResponseEntity.status(fromBusinessCode(code)).body(Result.fail(code, message));
    }
}
