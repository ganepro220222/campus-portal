-- =============================================================================
-- point_record 重复数据清理（执行 patch-point-record-unique.sql 之前）
-- 适用：历史库存在重复 (member_id, action, remark) 且 remark 非空
-- =============================================================================
-- 规则：保留同一组中 id 最小（最早）的一条；删除其余重复流水。
-- 积分余额：删除的重复流水积分不会自动从 member.points 扣回，须人工核对后处理。
-- =============================================================================

-- Step 1：查重审计（应先执行，有结果再跑 Step 2）
SELECT
    member_id,
    action,
    remark,
    COUNT(*) AS dup_count,
    SUM(points) AS total_points,
    MIN(id) AS keep_id,
    GROUP_CONCAT(id ORDER BY id) AS all_ids
FROM point_record
WHERE remark IS NOT NULL
GROUP BY member_id, action, remark
HAVING dup_count > 1;

-- Step 2：按会员汇总“将删除的重复流水”积分（供人工决定是否扣回 member.points）
SELECT
    pr.member_id,
    SUM(pr.points) AS points_to_remove,
    COUNT(*) AS rows_to_remove
FROM point_record pr
INNER JOIN (
    SELECT member_id, action, remark, MIN(id) AS keep_id
    FROM point_record
    WHERE remark IS NOT NULL
    GROUP BY member_id, action, remark
    HAVING COUNT(*) > 1
) d ON pr.member_id = d.member_id
   AND pr.action = d.action
   AND pr.remark = d.remark
   AND pr.id <> d.keep_id
GROUP BY pr.member_id;

-- Step 3：删除重复记录（保留 keep_id）
DELETE pr
FROM point_record pr
INNER JOIN (
    SELECT member_id, action, remark, MIN(id) AS keep_id
    FROM point_record
    WHERE remark IS NOT NULL
    GROUP BY member_id, action, remark
    HAVING COUNT(*) > 1
) d ON pr.member_id = d.member_id
   AND pr.action = d.action
   AND pr.remark = d.remark
   AND pr.id <> d.keep_id;

-- Step 4（可选，需业务确认后手工执行）：按 Step 2 结果扣回会员积分
-- UPDATE member m
-- JOIN ( ... points_to_remove per member ... ) x ON m.id = x.member_id
-- SET m.points = GREATEST(m.points - x.points_to_remove, 0);
