-- 课程完成等业务积分幂等：同一用户同一 action+remark 仅一条流水
-- 执行前请确认无重复数据：SELECT member_id, action, remark, COUNT(*) FROM point_record GROUP BY 1,2,3 HAVING COUNT(*) > 1;

ALTER TABLE `point_record`
  ADD UNIQUE KEY `uk_member_action_remark` (`member_id`, `action`, `remark`);
