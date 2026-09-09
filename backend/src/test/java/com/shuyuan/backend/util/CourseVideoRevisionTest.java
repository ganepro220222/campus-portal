package com.shuyuan.backend.util;

import com.shuyuan.backend.common.exception.BusinessException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CourseVideoRevisionTest {

    @Test
    void resolve_defaultsBlankToOne() {
        assertEquals(1L, CourseVideoRevision.resolve(null));
        assertEquals(1L, CourseVideoRevision.resolve(0L));
        assertEquals(4L, CourseVideoRevision.resolve(4L));
    }

    @Test
    void next_incrementsFromResolvedValue() {
        assertEquals(2L, CourseVideoRevision.next(null));
        assertEquals(3L, CourseVideoRevision.next(2L));
    }

    @Test
    void requireMatching_allowsLegacyClientOnInitialRevision() {
        assertDoesNotThrow(() -> CourseVideoRevision.requireMatching(null, 1L));
    }

    @Test
    void requireMatching_rejectsLegacyClientAfterReplace() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> CourseVideoRevision.requireMatching(null, 2L));
        assertEquals(409, ex.getCode());
        assertEquals(CourseVideoRevision.ERROR_KEY, ex.getErrorKey());
    }

    @Test
    void requireMatching_rejectsStaleRevision() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> CourseVideoRevision.requireMatching(1L, 2L));
        assertEquals(409, ex.getCode());
        assertEquals("课程视频已更新，请重新打开课程", ex.getMessage());
    }

    @Test
    void requireMatching_acceptsCurrentRevision() {
        assertDoesNotThrow(() -> CourseVideoRevision.requireMatching(2L, 2L));
    }
}
