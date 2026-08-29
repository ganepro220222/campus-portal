package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.EnrollRequest;
import com.shuyuan.backend.entity.Activity;
import com.shuyuan.backend.entity.Enroll;
import com.shuyuan.backend.entity.MemberProfile;
import com.shuyuan.backend.mapper.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Map;

import static com.shuyuan.backend.service.UpdateWrapperAssertions.assertSetsColumn;
import static com.shuyuan.backend.service.UpdateWrapperAssertions.initEntityCache;
import static com.shuyuan.backend.service.UpdateWrapperAssertions.updateCaptor;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * 报名核心场景单测：防重复、满员、取消释放名额
 */
@ExtendWith(MockitoExtension.class)
class EnrollServiceTest {

    /** 重新报名要把 reject_reason 写成 NULL，走 LambdaUpdateWrapper，需实体缓存 */
    @BeforeAll
    static void initMybatisPlusEntityCache() {
        initEntityCache(Enroll.class);
    }

    @Mock
    private ActivityMapper activityMapper;
    @Mock
    private EnrollMapper enrollMapper;
    @Mock
    private MemberProfileMapper memberProfileMapper;
    @Mock
    private EventLogService eventLogService;
    @Mock
    private PointService pointService;
    @Mock
    private MessageService messageService;
    @Mock
    private SubscribeOutboxService subscribeOutboxService;

    private EnrollService enrollService;

    private static final Long MEMBER_ID = 100L;
    private static final Long ACTIVITY_ID = 1L;

    @BeforeEach
    void setUp() {
        MemberContext.setMemberId(MEMBER_ID);
        enrollService = new EnrollService(
                activityMapper, enrollMapper, memberProfileMapper,
                eventLogService, pointService, messageService, subscribeOutboxService);
    }

    @AfterEach
    void tearDown() {
        MemberContext.clear();
    }

    @Test
    void enroll_success_whenQuotaAvailable() {
        Activity activity = publishedActivity(10, 3);
        EnrollRequest req = enrollRequest();

        when(activityMapper.selectById(ACTIVITY_ID)).thenReturn(activity);
        when(enrollMapper.selectOne(any())).thenReturn(null);
        when(memberProfileMapper.selectById(MEMBER_ID)).thenReturn(memberProfile());
        when(activityMapper.incrEnrolledCount(ACTIVITY_ID)).thenReturn(1);

        Map<String, Object> result = enrollService.enroll(ACTIVITY_ID, req);

        assertNotNull(result);
        verify(activityMapper).incrEnrolledCount(ACTIVITY_ID);
        verify(enrollMapper).insert(any(Enroll.class));
        verify(messageService).create(eq(MEMBER_ID), anyString(), anyString(), eq("enroll"), eq("activity"), eq(ACTIVITY_ID));
        verify(subscribeOutboxService).enqueueEnrollSuccess(eq(MEMBER_ID), any(Activity.class), any(Enroll.class));
        verify(eventLogService).record("enroll", "activity", ACTIVITY_ID);
        verify(pointService).award(MEMBER_ID, "enroll_activity");
    }

    @Test
    void enroll_enqueuesOutboxInSameTransaction() {
        Activity activity = publishedActivity(10, 3);
        EnrollRequest req = enrollRequest();

        when(activityMapper.selectById(ACTIVITY_ID)).thenReturn(activity);
        when(enrollMapper.selectOne(any())).thenReturn(null);
        when(memberProfileMapper.selectById(MEMBER_ID)).thenReturn(memberProfile());
        when(activityMapper.incrEnrolledCount(ACTIVITY_ID)).thenReturn(1);

        enrollService.enroll(ACTIVITY_ID, req);

        verify(subscribeOutboxService).enqueueEnrollSuccess(eq(MEMBER_ID), any(Activity.class), any(Enroll.class));
        verifyNoMoreInteractions(subscribeOutboxService);
    }

    @Test
    void 被拒后重新报名会清掉上一次的拒绝理由() {
        Activity activity = publishedActivity(10, 3);
        Enroll rejected = new Enroll();
        rejected.setId(21L);
        rejected.setStatus("rejected");
        rejected.setRejectReason("材料不全");

        when(activityMapper.selectById(ACTIVITY_ID)).thenReturn(activity);
        when(enrollMapper.selectOne(any())).thenReturn(rejected);
        when(memberProfileMapper.selectById(MEMBER_ID)).thenReturn(memberProfile());
        when(enrollMapper.selectById(21L)).thenReturn(rejected);
        when(activityMapper.incrEnrolledCount(ACTIVITY_ID)).thenReturn(1);

        enrollService.enroll(ACTIVITY_ID, enrollRequest());

        ArgumentCaptor<LambdaUpdateWrapper<Enroll>> cap = updateCaptor();
        verify(enrollMapper).update(isNull(), cap.capture());
        // 不清的话，后台报名列表里「待审核」旁边会一直挂着上次的拒绝理由
        assertSetsColumn(cap.getValue(), "reject_reason", null);
        assertSetsColumn(cap.getValue(), "status", "approved");
    }

    @Test
    void enroll_rejectsDuplicateActiveEnroll() {
        Activity activity = publishedActivity(10, 3);
        Enroll existing = new Enroll();
        existing.setId(9L);
        existing.setStatus("approved");

        when(activityMapper.selectById(ACTIVITY_ID)).thenReturn(activity);
        when(enrollMapper.selectOne(any())).thenReturn(existing);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> enrollService.enroll(ACTIVITY_ID, enrollRequest()));
        assertEquals(409, ex.getCode());
        verify(activityMapper, never()).incrEnrolledCount(anyLong());
        verify(subscribeOutboxService, never()).enqueueEnrollSuccess(anyLong(), any(), any());
    }

    @Test
    void enroll_rejectsWhenQuotaFull() {
        Activity activity = publishedActivity(5, 5);

        when(activityMapper.selectById(ACTIVITY_ID)).thenReturn(activity);
        when(enrollMapper.selectOne(any())).thenReturn(null);
        when(memberProfileMapper.selectById(MEMBER_ID)).thenReturn(memberProfile());
        when(activityMapper.incrEnrolledCount(ACTIVITY_ID)).thenReturn(0);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> enrollService.enroll(ACTIVITY_ID, enrollRequest()));
        assertEquals(409, ex.getCode());
        assertTrue(ex.getMessage().contains("名额已满"));
        verify(subscribeOutboxService, never()).enqueueEnrollSuccess(anyLong(), any(), any());
    }

    @Test
    void cancelEnroll_releasesQuota() {
        Activity activity = publishedActivity(10, 5);
        Enroll enroll = new Enroll();
        enroll.setId(20L);
        enroll.setMemberId(MEMBER_ID);
        enroll.setActivityId(ACTIVITY_ID);
        enroll.setStatus("approved");

        when(activityMapper.selectById(ACTIVITY_ID)).thenReturn(activity);
        when(enrollMapper.selectOne(any())).thenReturn(enroll);

        enrollService.cancelEnroll(ACTIVITY_ID);

        verify(enrollMapper).updateById(argThat((Enroll e) -> "cancelled".equals(e.getStatus())));
        verify(activityMapper).decrEnrolledCount(ACTIVITY_ID);
    }

    @Test
    void cancelEnroll_rejectsAfterEnrollDeadline() {
        Activity activity = publishedActivity(10, 5);
        activity.setEnrollEndTime(LocalDateTime.now().minusHours(1));

        when(activityMapper.selectById(ACTIVITY_ID)).thenReturn(activity);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> enrollService.cancelEnroll(ACTIVITY_ID));
        assertEquals(409, ex.getCode());
        assertTrue(ex.getMessage().contains("报名已截止"));
        verify(activityMapper, never()).decrEnrolledCount(anyLong());
    }

    @Test
    void cancelEnroll_rejectsAfterActivityStarted() {
        Activity activity = publishedActivity(10, 5);
        activity.setStartTime(LocalDateTime.now().minusMinutes(30));

        when(activityMapper.selectById(ACTIVITY_ID)).thenReturn(activity);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> enrollService.cancelEnroll(ACTIVITY_ID));
        assertEquals(409, ex.getCode());
        assertTrue(ex.getMessage().contains("活动已经开始"));
        verify(activityMapper, never()).decrEnrolledCount(anyLong());
    }

    @Test
    void enroll_requiresLogin() {
        MemberContext.clear();
        BusinessException ex = assertThrows(BusinessException.class,
                () -> enrollService.enroll(ACTIVITY_ID, enrollRequest()));
        assertEquals(401, ex.getCode());
    }

    @Test
    void enroll_rejectsInvalidPhone_beforeQuotaIncr() {
        Activity activity = publishedActivity(10, 3);
        EnrollRequest req = enrollRequest();
        req.setPhone("1");

        when(activityMapper.selectById(ACTIVITY_ID)).thenReturn(activity);
        when(enrollMapper.selectOne(any())).thenReturn(null);
        when(memberProfileMapper.selectById(MEMBER_ID)).thenReturn(memberProfile());

        BusinessException ex = assertThrows(BusinessException.class,
                () -> enrollService.enroll(ACTIVITY_ID, req));
        assertEquals(400, ex.getCode());
        assertTrue(ex.getMessage().contains("手机号"));
        verify(activityMapper, never()).incrEnrolledCount(anyLong());
        verify(enrollMapper, never()).insert(any(Enroll.class));
    }

    @Test
    void enroll_rejectsInvalidProfilePhone_beforeQuotaIncr() {
        Activity activity = publishedActivity(10, 3);
        EnrollRequest req = new EnrollRequest();
        MemberProfile profile = memberProfile();
        profile.setPhone("123456");

        when(activityMapper.selectById(ACTIVITY_ID)).thenReturn(activity);
        when(enrollMapper.selectOne(any())).thenReturn(null);
        when(memberProfileMapper.selectById(MEMBER_ID)).thenReturn(profile);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> enrollService.enroll(ACTIVITY_ID, req));
        assertEquals(400, ex.getCode());
        verify(activityMapper, never()).incrEnrolledCount(anyLong());
    }

    @Test
    void enroll_rejectsBlankIdentity_beforeQuotaIncr() {
        Activity activity = publishedActivity(10, 3);
        EnrollRequest req = new EnrollRequest();

        when(activityMapper.selectById(ACTIVITY_ID)).thenReturn(activity);
        when(enrollMapper.selectOne(any())).thenReturn(null);
        when(memberProfileMapper.selectById(MEMBER_ID)).thenReturn(null);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> enrollService.enroll(ACTIVITY_ID, req));
        assertEquals(400, ex.getCode());
        verify(activityMapper, never()).incrEnrolledCount(anyLong());
    }

    @Test
    void enroll_usesProfileWhenRequestEmpty() {
        Activity activity = publishedActivity(10, 3);
        EnrollRequest req = new EnrollRequest();

        when(activityMapper.selectById(ACTIVITY_ID)).thenReturn(activity);
        when(enrollMapper.selectOne(any())).thenReturn(null);
        when(memberProfileMapper.selectById(MEMBER_ID)).thenReturn(memberProfile());
        when(activityMapper.incrEnrolledCount(ACTIVITY_ID)).thenReturn(1);

        Map<String, Object> result = enrollService.enroll(ACTIVITY_ID, req);

        assertNotNull(result);
        verify(activityMapper).incrEnrolledCount(ACTIVITY_ID);
        verify(enrollMapper).insert(argThat((Enroll enroll) ->
                "张三".equals(enroll.getName()) && "13800138000".equals(enroll.getPhone())));
    }

    @Test
    void voucher_requiresApprovedAndPublishedActivity() {
        Enroll pending = new Enroll();
        pending.setId(30L);
        pending.setMemberId(MEMBER_ID);
        pending.setActivityId(ACTIVITY_ID);
        pending.setStatus("pending");

        when(enrollMapper.selectById(30L)).thenReturn(pending);

        BusinessException pendingEx = assertThrows(BusinessException.class,
                () -> enrollService.voucher(30L));
        assertEquals(400, pendingEx.getCode());

        Enroll approved = new Enroll();
        approved.setId(31L);
        approved.setMemberId(MEMBER_ID);
        approved.setActivityId(ACTIVITY_ID);
        approved.setStatus("approved");
        approved.setVoucherCode("SY123");

        Activity cancelled = publishedActivity(10, 1);
        cancelled.setStatus("cancelled");

        when(enrollMapper.selectById(31L)).thenReturn(approved);
        when(activityMapper.selectById(ACTIVITY_ID)).thenReturn(cancelled);

        BusinessException activityEx = assertThrows(BusinessException.class,
                () -> enrollService.voucher(31L));
        assertTrue(activityEx.getMessage().contains("活动已取消"));
    }

    private Activity publishedActivity(int quota, int enrolled) {
        Activity activity = new Activity();
        activity.setId(ACTIVITY_ID);
        activity.setTitle("测试活动");
        activity.setStatus("published");
        activity.setQuota(quota);
        activity.setEnrolledCount(enrolled);
        activity.setNeedReview(0);
        activity.setEnrollStartTime(LocalDateTime.now().minusDays(1));
        activity.setEnrollEndTime(LocalDateTime.now().plusDays(1));
        return activity;
    }

    private MemberProfile memberProfile() {
        MemberProfile profile = new MemberProfile();
        profile.setMemberId(MEMBER_ID);
        profile.setRealName("张三");
        profile.setPhone("13800138000");
        return profile;
    }

    private EnrollRequest enrollRequest() {
        EnrollRequest req = new EnrollRequest();
        req.setName("张三");
        req.setPhone("13800138000");
        return req;
    }
}
