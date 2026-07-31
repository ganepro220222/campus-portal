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
$ROOT = realpath(__DIR__ . '/..');            // exhibits/
$uri  = $_SERVER['REQUEST_URI'] ?? '';
$action = $_GET['action'] ?? '';
$isIdentity = $action === 'identity' || strpos($uri, 'identity') !== false;
$isCreate = $action === 'create' || strpos($uri, 'create') !== false;
$isSave = $action === 'save' || strpos($uri, 'save') !== false;
$isList = $action === 'list' || strpos($uri, 'list') !== false;
$isLocal = in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true);

function studio_escape_html(string $s): string {
  return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function studio_normalize_numeric_suffix(string $digits): string {
  if (!ctype_digit($digits)) throw new Exception('非法展品编号');
  $trimmed = preg_replace('/^0+(?=\d)/', '', $digits);
  if ($trimmed === '') $trimmed = '0';
  if (strlen($trimmed) > 32) throw new Exception('展品编号过长');
  return str_pad($trimmed, 3, '0', STR_PAD_LEFT);
}

function studio_normalize_exhibit_dir(string $raw): string {
  $s = trim($raw, " \t\n\r\0\x0B/\\");
  if ($s === '') throw new Exception('展品目录不能为空');
  if (ctype_digit($s)) {
    $s = 'craft-' . studio_normalize_numeric_suffix($s);
  } elseif (stripos($s, 'craft-') !== 0) {
    $s = 'craft-' . $s;
  }
  if ($s === 'craft-' || !preg_match('/^[A-Za-z0-9_-]+$/', $s)) throw new Exception('非法展品目录名：' . $s);
  return $s;
}

function studio_write_file(string $path, string $content): void {
  $n = file_put_contents($path, $content);
  if ($n === false || $n !== strlen($content)) {
    throw new Exception("写入失败：$path");
  }
}

function studio_validate_template(string $template): void {
  $cfg = "$template/config.json";
  $idx = "$template/index.html";
  if (!is_file($cfg)) throw new Exception('模板缺少 config.json');
  if (!is_file($idx)) throw new Exception('模板缺少 index.html');
  json_decode(file_get_contents($cfg), true, 512, JSON_THROW_ON_ERROR);
}

function studio_create_exhibit(string $root, string $dir, string $title, string $subtitle = ''): array {
  $ex = studio_normalize_exhibit_dir($dir);
  $name = trim($title);
  if ($name === '') throw new Exception('展品名称不能为空');
  $sub = trim($subtitle);
  $template = "$root/_template";
  $dest = "$root/$ex";
  studio_validate_template($template);
  if (is_dir($dest)) throw new Exception("展品目录已存在：$ex");

  $templateCfg = json_decode(file_get_contents("$template/config.json"), true, 512, JSON_THROW_ON_ERROR);
  $templateIdx = file_get_contents("$template/index.html");
  $templateCfg['id'] = $ex;
  $templateCfg['i18n'] = $templateCfg['i18n'] ?? [];
  $templateCfg['i18n']['zh'] = $templateCfg['i18n']['zh'] ?? [];
  $templateCfg['i18n']['zh']['title'] = $name;
  $templateCfg['i18n']['zh']['subtitle'] = $sub;

  $tmp = "$root/._creating-$ex-" . bin2hex(random_bytes(4));
  try {
    studio_copy_tree($template, $tmp);
    $json = json_encode($templateCfg, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) throw new Exception('config.json 序列化失败');
    studio_write_file("$tmp/config.json", $json . "\n");
    $safeTitle = studio_escape_html($name);
    $index = str_replace(['__EX__', '__TITLE__'], [$ex, $safeTitle], $templateIdx);
    studio_write_file("$tmp/index.html", $index);
    if (!@rename($tmp, $dest)) throw new Exception('无法完成展品目录创建');
  } catch (Throwable $e) {
    studio_rm_tree($tmp);
    throw $e;
  }
  return ['dir' => $ex, 'title' => $name, 'subtitle' => $sub, 'assetsDir' => "$ex/assets"];
}

function studio_copy_tree(string $src, string $dst): void {
  if (!is_dir($dst) && !mkdir($dst, 0775, true) && !is_dir($dst)) throw new Exception("无法创建临时目录：$dst");
  foreach (scandir($src) as $item) {
    if ($item === '.' || $item === '..') continue;
    $from = "$src/$item"; $to = "$dst/$item";
    if (is_dir($from)) { studio_copy_tree($from, $to); continue; }
    if (!copy($from, $to)) throw new Exception("复制失败：$from");
  }
}

function studio_rm_tree(string $path): void {
  if (!file_exists($path)) return;
  if (is_file($path) || is_link($path)) { @unlink($path); return; }
  foreach (scandir($path) as $item) {
    if ($item === '.' || $item === '..') continue;
    studio_rm_tree("$path/$item");
  }
  @rmdir($path);
}

function studio_root_hash(string $root): string {
  $norm = str_replace('\\', '/', $root);
  if (DIRECTORY_SEPARATOR === '\\') $norm = strtolower($norm);
  return substr(hash('sha256', $norm), 0, 32);
}

if ($PASS !== '' && !($isIdentity && $isLocal)) {
  if (!isset($_SERVER['PHP_AUTH_USER']) || $_SERVER['PHP_AUTH_USER'] !== $USER || ($_SERVER['PHP_AUTH_PW'] ?? '') !== $PASS) {
    header('WWW-Authenticate: Basic realm="3D Studio"'); http_response_code(401); echo '需要登录'; exit;
  }
}
header('Content-Type: application/json; charset=utf-8');

$rootHash = studio_root_hash($ROOT);

if ($isIdentity) {
  echo json_encode(['rootHash' => $rootHash, 'instanceId' => $rootHash], JSON_UNESCAPED_UNICODE); exit;
}

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
  echo json_encode(['exhibits' => $out, 'capabilities' => ['save' => true, 'create' => true, 'batch' => true]], JSON_UNESCAPED_UNICODE); exit;
}

if ($isCreate && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
  $in = json_decode(file_get_contents('php://input'), true) ?: [];
  try {
    $created = studio_create_exhibit($ROOT, $in['dir'] ?? '', $in['title'] ?? '', $in['subtitle'] ?? '');
    echo json_encode(['ok' => true] + $created, JSON_UNESCAPED_UNICODE); exit;
  } catch (Throwable $e) {
    http_response_code(400); echo json_encode(['ok' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE); exit;
  }
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
