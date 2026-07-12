package com.shuyuan.backend.common;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ApiHttpStatusTest {

    @Test
    void fromBusinessCode_mapsCommonCodes() {
        assertEquals(HttpStatus.BAD_REQUEST, ApiHttpStatus.fromBusinessCode(400));
        assertEquals(HttpStatus.UNAUTHORIZED, ApiHttpStatus.fromBusinessCode(401));
        assertEquals(HttpStatus.FORBIDDEN, ApiHttpStatus.fromBusinessCode(403));
        assertEquals(HttpStatus.NOT_FOUND, ApiHttpStatus.fromBusinessCode(404));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ApiHttpStatus.fromBusinessCode(429));
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, ApiHttpStatus.fromBusinessCode(500));
    }
}
