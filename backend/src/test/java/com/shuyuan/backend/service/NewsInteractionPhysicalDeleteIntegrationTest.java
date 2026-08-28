package com.shuyuan.backend.service;

import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.entity.Member;
import com.shuyuan.backend.entity.News;
import com.shuyuan.backend.mapper.MemberMapper;
import com.shuyuan.backend.mapper.NewsMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 验证点赞/收藏取消为物理删除，且再添加前会清理软删残留。
 * <p>需本地 shuyuan_test + Redis，并设 {@code RUN_MYSQL_IT=1}：
 * {@code RUN_MYSQL_IT=1 mvn test -Dtest=NewsInteractionPhysicalDeleteIntegrationTest}
 */
@SpringBootTest
@ActiveProfiles("test")
@EnabledIfEnvironmentVariable(named = "RUN_MYSQL_IT", matches = "1")
@Transactional
class NewsInteractionPhysicalDeleteIntegrationTest {

    @Autowired
    private NewsInteractionService newsInteractionService;
    @Autowired
    private FavoriteService favoriteService;
    @Autowired
    private NewsMapper newsMapper;
    @Autowired
    private MemberMapper memberMapper;
    @Autowired
    private JdbcTemplate jdbc;

    private Long memberId;
    private Long newsId;

    @BeforeEach
    void setUp() {
        Member member = new Member();
        member.setOpenid("it-like-" + UUID.randomUUID());
        member.setNickname("it-like");
        member.setPoints(0);
        member.setStatus(1);
        member.setTokenVersion(1);
        member.setCreateTime(LocalDateTime.now());
        member.setUpdateTime(LocalDateTime.now());
        memberMapper.insert(member);
        memberId = member.getId();
        MemberContext.setMemberId(memberId);

        News news = new News();
        news.setTitle("IT like/favorite");
        news.setContent("body");
        news.setStatus("published");
        news.setLikeCount(0);
        news.setFavoriteCount(0);
        news.setViewCount(0);
        news.setIsTop(0);
        news.setPublishTime(LocalDateTime.now());
        news.setCreateTime(LocalDateTime.now());
        news.setUpdateTime(LocalDateTime.now());
        newsMapper.insert(news);
        newsId = news.getId();
    }

    @AfterEach
    void tearDown() {
        MemberContext.clear();
    }

    @Test
    void toggleLike_likeUnlikeLike_leavesNoSoftDeletedRow() {
        Map<String, Object> first = newsInteractionService.toggleLike(newsId);
        assertTrue((Boolean) first.get("liked"));
        assertEquals(1, countLikeRows());
        assertEquals(0, countSoftDeletedLikeRows());

        Map<String, Object> second = newsInteractionService.toggleLike(newsId);
        assertFalse((Boolean) second.get("liked"));
        assertEquals(0, countLikeRows());
        assertEquals(0, countSoftDeletedLikeRows());

        Map<String, Object> third = newsInteractionService.toggleLike(newsId);
        assertTrue((Boolean) third.get("liked"));
        assertEquals(1, countLikeRows());
        assertEquals(0, countSoftDeletedLikeRows());
    }

    @Test
    void toggleLike_clearsPreexistingSoftDeletedGhost() {
        jdbc.update(
                "INSERT INTO like_record (member_id, target_type, target_id, is_deleted, create_time, update_time) "
                        + "VALUES (?, 'news', ?, 1, NOW(), NOW())",
                memberId, newsId);
        assertEquals(1, countSoftDeletedLikeRows());

        Map<String, Object> result = newsInteractionService.toggleLike(newsId);
        assertTrue((Boolean) result.get("liked"));
        assertEquals(1, countLikeRows());
        assertEquals(0, countSoftDeletedLikeRows());
    }

    @Test
    void toggleFavorite_collectUncollectCollect_leavesNoSoftDeletedRow() {
        Map<String, Object> first = favoriteService.toggle("news", newsId);
        assertTrue((Boolean) first.get("collected"));
        assertEquals(1, countFavoriteRows());
        assertEquals(0, countSoftDeletedFavoriteRows());

        Map<String, Object> second = favoriteService.toggle("news", newsId);
        assertFalse((Boolean) second.get("collected"));
        assertEquals(0, countFavoriteRows());

        Map<String, Object> third = favoriteService.toggle("news", newsId);
        assertTrue((Boolean) third.get("collected"));
        assertEquals(1, countFavoriteRows());
        assertEquals(0, countSoftDeletedFavoriteRows());
    }

    private int countLikeRows() {
        Integer n = jdbc.queryForObject(
                "SELECT COUNT(1) FROM like_record WHERE member_id = ? AND target_type = 'news' AND target_id = ?",
                Integer.class, memberId, newsId);
        return n != null ? n : 0;
    }

    private int countSoftDeletedLikeRows() {
        Integer n = jdbc.queryForObject(
                "SELECT COUNT(1) FROM like_record WHERE member_id = ? AND target_type = 'news' AND target_id = ? AND is_deleted = 1",
                Integer.class, memberId, newsId);
        return n != null ? n : 0;
    }

    private int countFavoriteRows() {
        Integer n = jdbc.queryForObject(
                "SELECT COUNT(1) FROM favorite WHERE member_id = ? AND target_type = 'news' AND target_id = ?",
                Integer.class, memberId, newsId);
        return n != null ? n : 0;
    }

    private int countSoftDeletedFavoriteRows() {
        Integer n = jdbc.queryForObject(
                "SELECT COUNT(1) FROM favorite WHERE member_id = ? AND target_type = 'news' AND target_id = ? AND is_deleted = 1",
                Integer.class, memberId, newsId);
        return n != null ? n : 0;
    }
}
