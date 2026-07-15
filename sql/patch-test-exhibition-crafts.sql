-- 展馆真实测试模型（test/1、7、8 批处理产物）— 本地 dev 联调
-- 前置：viewer/public/models 与 posters 已放置 GLB/JPG；Vite dev 运行于 :5174
-- 可重复执行

SET @base := 'http://localhost:5174/craft';

-- 文创 1（替换原演示数据为真实扫描模型）
UPDATE `craft` SET
  `name` = '展馆测试工艺品·1号',
  `intro_zh` = '来自 test/1 真实 OBJ 批处理模型，用于沉浸式鉴赏联调。',
  `preview_type` = 'model3d',
  `model_3d_url` = CONCAT(@base, '/models/1__1-97de61fe.glb'),
  `poster_url` = CONCAT(@base, '/posters/1.jpg'),
  `transform_json` = JSON_OBJECT('scale', 1.0475, 'offsetX', -0.0021, 'offsetY', -0.16716, 'offsetZ', 0.00096),
  `material_json` = JSON_OBJECT('roughness', 0.15, 'metalness', 0.02, 'envMapIntensity', 1.3),
  `camera_json` = JSON_OBJECT('distance', 8.4, 'phi', 1.48, 'theta', 0.35, 'autoRotate', true),
  `viewer_enabled` = 1,
  `status` = 1
WHERE `id` = 1;

-- 文创 7、8（展馆编号对应 test 子目录）
INSERT INTO `craft` (`id`, `name`, `intro_zh`, `intro_en`, `category_id`, `preview_type`, `model_3d_url`, `poster_url`,
  `transform_json`, `material_json`, `camera_json`, `viewer_enabled`, `sort`, `status`)
VALUES
(7, '展馆测试工艺品·7号', '来自 test/7 真实 OBJ 批处理模型。', 'Exhibition test craft #7 from real OBJ scan.', 12, 'model3d',
 CONCAT(@base, '/models/7__7-a7b2de38.glb'), CONCAT(@base, '/posters/7.jpg'),
 JSON_OBJECT('scale', 1.98413, 'offsetX', 0, 'offsetY', -0.32907, 'offsetZ', 0),
 JSON_OBJECT('roughness', 0.15, 'metalness', 0.02, 'envMapIntensity', 1.3),
 JSON_OBJECT('distance', 8.4, 'phi', 1.48, 'theta', 0.35, 'autoRotate', true),
 1, 7, 1),
(8, '展馆测试工艺品·8号', '来自 test/8 真实 OBJ 批处理模型。', 'Exhibition test craft #8 from real OBJ scan.', 12, 'model3d',
 CONCAT(@base, '/models/8__8-a5be5406.glb'), CONCAT(@base, '/posters/8.jpg'),
 JSON_OBJECT('scale', 3.19575, 'offsetX', -0.02125, 'offsetY', -0.90725, 'offsetZ', -0.02183),
 JSON_OBJECT('roughness', 0.15, 'metalness', 0.02, 'envMapIntensity', 1.3),
 JSON_OBJECT('distance', 8.4, 'phi', 1.48, 'theta', 0.35, 'autoRotate', true),
 1, 8, 1)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `intro_zh` = VALUES(`intro_zh`),
  `preview_type` = VALUES(`preview_type`),
  `model_3d_url` = VALUES(`model_3d_url`),
  `poster_url` = VALUES(`poster_url`),
  `transform_json` = VALUES(`transform_json`),
  `viewer_enabled` = VALUES(`viewer_enabled`),
  `status` = VALUES(`status`);

INSERT IGNORE INTO `craft_contact` (`craft_id`, `phone`, `wechat`, `email`) VALUES
(7, '0851-12345678', 'shuyuan_craft', 'craft@gzjtzy.edu.cn'),
(8, '0851-12345678', 'shuyuan_craft', 'craft@gzjtzy.edu.cn');

INSERT IGNORE INTO `craft_image` (`craft_id`, `image_url`, `angle_label`, `sort`) VALUES
(7, CONCAT(@base, '/posters/7.jpg'), '正面', 1),
(8, CONCAT(@base, '/posters/8.jpg'), '正面', 1);
