-- 报名积分只读核对，不改正数据。
-- 旧流水 remark 为空，无法和报名行一一对应；同一天可能另有已通过报名，不能直接删分。

-- 1) 仍按旧规则写下的报名积分（没有 enroll:{id}）
SELECT pr.id AS point_record_id,
       pr.member_id,
       pr.points,
       pr.remark,
       pr.created_at
FROM point_record pr
WHERE pr.action = 'enroll_activity'
  AND (pr.remark IS NULL OR pr.remark NOT LIKE 'enroll:%')
ORDER BY pr.created_at DESC;

-- 2) 待审核 / 已拒绝 / 已取消报名，若同一天有无对象编号的报名积分，仅作可疑线索
SELECT e.id AS enroll_id,
       e.member_id,
       e.activity_id,
       e.status,
       e.create_time,
       pr.id AS point_record_id,
       pr.created_at AS points_at,
       pr.points
FROM enroll e
JOIN point_record pr
  ON pr.member_id = e.member_id
 AND pr.action = 'enroll_activity'
 AND pr.remark IS NULL
 AND DATE(pr.created_at) = DATE(e.create_time)
WHERE e.status IN ('pending', 'rejected', 'cancelled')
ORDER BY e.create_time DESC;

-- 3) 已通过报名是否已有对象级幂等流水（新逻辑上线后应逐步出现）
SELECT e.id AS enroll_id,
       e.member_id,
       e.activity_id,
       e.create_time,
       pr.id AS point_record_id,
       pr.remark
FROM enroll e
LEFT JOIN point_record pr
  ON pr.member_id = e.member_id
 AND pr.action = 'enroll_activity'
 AND pr.remark = CONCAT('enroll:', e.id)
WHERE e.status = 'approved'
ORDER BY e.create_time DESC;
