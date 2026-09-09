package com.shuyuan.backend.util;

import com.shuyuan.backend.common.exception.BusinessException;

/**
 * 课程教学视频版本：换片递增，旧播放会话不得写回新片进度。
 */
public final class CourseVideoRevision {

    public static final String ERROR_KEY = "COURSE_VIDEO_UPDATED";
    public static final String UPDATED_MESSAGE = "课程视频已更新，请重新打开课程";

    private CourseVideoRevision() {}

    public static long resolve(Long revision) {
        return revision == null || revision < 1 ? 1L : revision;
    }

    public static long next(Long revision) {
        return resolve(revision) + 1;
    }

    public static boolean same(Long left, Long right) {
        return resolve(left) == resolve(right);
    }

    /**
     * 旧客户端可能不带版本。课程仍是初始版本时放行；换片后缺字段或旧版本一律拒绝。
     */
    public static void requireMatching(Long incoming, long current) {
        if (incoming == null) {
            if (current > 1) {
                throw staleSession();
            }
            return;
        }
        if (incoming < 1 || incoming != current) {
            throw staleSession();
        }
    }

    public static BusinessException staleSession() {
        return new BusinessException(409, UPDATED_MESSAGE, ERROR_KEY);
    }
}
