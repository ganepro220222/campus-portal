<?php
/**
 * 3D 鉴赏工作台 · 保存/列目录接口（PHP 版，与 studio-server.mjs 等价）
 *
 * 路由（Nginx/Apache 里把这两条重写到本文件即可）：
 *   /studio-api/list  ->  api.php?action=list
 *   /studio-api/save  ->  api.php?action=save   (POST)
 * 或直接访问 _server/api.php?action=list / ?action=save。
 *
 * 鉴权：设环境变量 STUDIO_PASS（配合 STUDIO_USER，默认 admin）启用 Basic Auth；
 *      生产务必设密码，并只在受保护路径暴露本接口。
 */
$USER = getenv('STUDIO_USER') ?: 'admin';
$PASS = getenv('STUDIO_PASS') ?: '';
if ($PASS !== '') {
  if (!isset($_SERVER['PHP_AUTH_USER']) || $_SERVER['PHP_AUTH_USER'] !== $USER || ($_SERVER['PHP_AUTH_PW'] ?? '') !== $PASS) {
    header('WWW-Authenticate: Basic realm="3D Studio"'); http_response_code(401); echo '需要登录'; exit;
  }
}
header('Content-Type: application/json; charset=utf-8');
$ROOT = realpath(__DIR__ . '/..');            // exhibits/
$uri  = $_SERVER['REQUEST_URI'] ?? '';
$action = $_GET['action'] ?? '';
$isSave = $action === 'save' || strpos($uri, 'save') !== false;
$isList = $action === 'list' || strpos($uri, 'list') !== false;

if ($isList) {
  $out = [];
  foreach (scandir($ROOT) as $d) {
    if ($d === '.' || $d === '..' || $d[0] === '_' || $d[0] === '.') continue;
    $cp = "$ROOT/$d/config.json";
    if (!is_file($cp)) continue;
    $c = json_decode(file_get_contents($cp), true) ?: [];
    $zh = $c['i18n']['zh'] ?? [];
    $out[] = [
      'dir' => $d, 'title' => $zh['title'] ?? $d, 'subtitle' => $zh['subtitle'] ?? '',
      'hotspots' => count($c['hotspots'] ?? []), 'audio' => count($c['audio'] ?? []),
      'hasPano' => !empty($c['assets']['panorama']),
      'poster' => !empty($c['assets']['poster']) ? "$d/" . $c['assets']['poster'] : '',
      'mtime' => filemtime($cp) * 1000,
    ];
  }
  usort($out, fn($a, $b) => $b['mtime'] <=> $a['mtime']);
  echo json_encode(['exhibits' => $out], JSON_UNESCAPED_UNICODE); exit;
}

if ($isSave && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
  $in  = json_decode(file_get_contents('php://input'), true) ?: [];
  $ex  = $in['ex'] ?? '';
  $cfg = $in['config'] ?? null;
  $poster = $in['poster'] ?? null;
  if (!preg_match('/^[A-Za-z0-9_-]+$/', $ex)) { http_response_code(400); echo json_encode(['ok' => false, 'error' => '非法展品目录']); exit; }
  $dir = "$ROOT/$ex"; $cp = "$dir/config.json";
  if (!is_dir($dir) || !$cfg || empty($cfg['assets']['model'])) { http_response_code(400); echo json_encode(['ok' => false, 'error' => '配置无效或目录不存在']); exit; }
  $bak = "$dir/.bak"; if (!is_dir($bak)) mkdir($bak, 0775, true);
  if (is_file($cp)) copy($cp, "$bak/config." . round(microtime(true) * 1000) . ".json");
  // 只保留最近 20 份备份
  $baks = glob("$bak/config.*.json"); sort($baks);
  while (count($baks) > 20) @unlink(array_shift($baks));
  // 缩略图（保存时自动刷新）：dataURL(jpeg) → assets/poster.jpg
  if (is_string($poster) && strpos($poster, 'data:image') === 0) {
    if (!is_dir("$dir/assets")) mkdir("$dir/assets", 0775, true);
    file_put_contents("$dir/assets/poster.jpg", base64_decode(substr($poster, strpos($poster, ',') + 1)));
    $cfg['assets']['poster'] = 'assets/poster.jpg';
  }
  file_put_contents($cp, json_encode($cfg, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
  echo json_encode(['ok' => true]); exit;
}

http_response_code(404);
echo json_encode(['error' => 'unknown action']);
