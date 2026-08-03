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
$isCheckPano = $action === 'check-panorama' || strpos($uri, 'check-panorama') !== false;
$isLocal = in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true);

function studio_escape_html(string $s): string {
  return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function studio_normalize_numeric_suffix(string $digits): string {
  if (!ctype_digit($digits)) throw new Exception('非法展品编号');
  if (strlen($digits) > 32) throw new Exception('展品编号过长');
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
  } elseif (preg_match('/^craft-([0-9]+)$/i', $s, $m)) {
    $s = 'craft-' . studio_normalize_numeric_suffix($m[1]);
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

function studio_is_remote_panorama(string $p): bool {
  return (bool)preg_match('#^(https?:|data:|blob:|//)#', trim($p));
}

/** 资源路径解析（模型 / 全景共用）；远程或空路径返回 null */
function studio_resolve_asset_path(string $root, string $exhibit, ?string $asset): ?string {
  $p = trim((string)$asset);
  if ($p === '' || studio_is_remote_panorama($p)) return null;
  if ($p[0] === '/') return "$root/" . ltrim($p, '/');
  if (preg_match('#^[A-Za-z]:[\\\\/]#', $p)) return $p;
  return "$root/$exhibit/$p";
}

/** 通用资源存在性判断（模型 / 全景共用同一套路径解析规则） */
function studio_has_asset_file(string $root, string $exhibit, ?string $asset): bool {
  $p = trim((string)$asset);
  if ($p === '') return false;
  if (studio_is_remote_panorama($p)) return true;
  $local = studio_resolve_asset_path($root, $exhibit, $p);
  return $local !== null && is_file($local);
}

/** 批量面板校验全景路径：true / false / unknown */
function studio_check_panorama_availability(string $root, ?string $path): string {
  $p = trim((string)$path);
  if ($p === '') return 'false';
  if (studio_is_remote_panorama($p)) return 'unknown';
  if (str_starts_with($p, '../') || str_starts_with($p, '/')) {
    return studio_has_asset_file($root, '_template', $p) ? 'true' : 'false';
  }
  return 'unknown';
}

// 与 pano-check.mjs / pano_check.py 保持一致；改算法请同步改版本号（说明见 pano-check.mjs）
const STUDIO_FINGERPRINT_VERSION = 'v1';
const STUDIO_FINGERPRINT_CHUNK = 65536;
const STUDIO_FINGERPRINT_LENGTH = 16;

/** 本地资源内容指纹（长度 + 头尾各 64KiB）；远程 / 缺失 / 读不出一律返回 '' */
function studio_asset_fingerprint(string $root, string $exhibit, ?string $asset): string {
  $local = studio_resolve_asset_path($root, $exhibit, $asset);
  if ($local === null || !is_file($local)) return '';
  $size = filesize($local);
  if ($size === false) return '';
  $fh = @fopen($local, 'rb');
  if ($fh === false) return '';
  $ctx = hash_init('sha1');
  hash_update($ctx, STUDIO_FINGERPRINT_VERSION . '|' . $size . '|');
  $headLen = min($size, STUDIO_FINGERPRINT_CHUNK);
  if ($headLen > 0) hash_update_stream($ctx, $fh, $headLen);
  $tailStart = max(STUDIO_FINGERPRINT_CHUNK, $size - STUDIO_FINGERPRINT_CHUNK);
  if ($size > $tailStart) {
    fseek($fh, $tailStart);
    hash_update_stream($ctx, $fh, $size - $tailStart);
  }
  fclose($fh);
  return substr(hash_final($ctx), 0, STUDIO_FINGERPRINT_LENGTH);
}

// ---------- 全景图候选清单（与 pano-check.mjs / pano_check.py 一致） ----------
const STUDIO_PANO_EXT = ['jpg', 'jpeg', 'png', 'webp'];
const STUDIO_PANO_SKIP_DIRS = ['node_modules', 'vendor', '_runtime', '_dev', 'e2e', 'test-results', 'playwright-report'];
const STUDIO_PANO_PUBLIC_DIRS = ['共享背景', '_panoramas', 'shared/panoramas'];
const STUDIO_PANO_RATIO_MIN = 1.9;
const STUDIO_PANO_RATIO_MAX = 2.1;
const STUDIO_PANO_MAX_SCAN = 400;

function studio_panorama_to_root_rel(string $root, string $exhibit, ?string $panorama): ?string {
  $p = trim((string)$panorama);
  if ($p === '' || studio_is_remote_panorama($p)) return null;
  $local = studio_resolve_asset_path($root, $exhibit, $p);
  if ($local === null) return null;
  $rootNorm = str_replace('\\', '/', realpath($root) ?: $root);
  $localNorm = str_replace('\\', '/', realpath($local) ?: $local);
  $prefix = rtrim($rootNorm, '/') . '/';
  if (strncmp($localNorm, $prefix, strlen($prefix)) !== 0) return null;
  return ltrim(substr($localNorm, strlen(rtrim($rootNorm, '/')) + 1), '/');
}

function studio_read_local_image_meta(string $root, string $rootRel): ?array {
  $full = "$root/" . str_replace('\\', '/', $rootRel);
  $ext = strtolower(pathinfo($full, PATHINFO_EXTENSION));
  if (!in_array($ext, STUDIO_PANO_EXT, true) || !is_file($full)) return null;
  $size = @getimagesize($full);
  if (!$size || empty($size[0]) || empty($size[1])) return null;
  $ratio = $size[0] / $size[1];
  if ($ratio < STUDIO_PANO_RATIO_MIN || $ratio > STUDIO_PANO_RATIO_MAX) return null;
  return ['width' => $size[0], 'height' => $size[1]];
}

function studio_list_exhibit_dirs(string $root): array {
  $out = [];
  $items = @scandir($root);
  if ($items === false) return $out;
  sort($items);
  foreach ($items as $name) {
    if ($name === '.' || $name === '..' || $name[0] === '_' || $name[0] === '.') continue;
    if (is_dir("$root/$name") && is_file("$root/$name/config.json")) $out[] = $name;
  }
  return $out;
}

function studio_list_panorama_candidates(string $root): array {
  $merged = [];

  $add = function (array $entry) use (&$merged) {
    if (count($merged) >= STUDIO_PANO_MAX_SCAN) return;
    $path = $entry['path'];
    if (!isset($merged[$path]) || (($merged[$path]['source'] ?? '') === 'shared' && ($entry['source'] ?? '') === 'configured')) {
      $merged[$path] = $entry;
    }
  };

  foreach (studio_list_exhibit_dirs($root) as $ex) {
    if (count($merged) >= STUDIO_PANO_MAX_SCAN) break;
    $cp = "$root/$ex/config.json";
    if (!is_file($cp)) continue;
    $c = json_decode(file_get_contents($cp), true) ?: [];
    $pano = $c['assets']['panorama'] ?? '';
    if ($pano === '' || studio_is_remote_panorama($pano)) continue;
    $rootRel = studio_panorama_to_root_rel($root, $ex, $pano);
    if ($rootRel === null) continue;
    $meta = studio_read_local_image_meta($root, $rootRel);
    if ($meta !== null) $add(['path' => $rootRel, 'width' => $meta['width'], 'height' => $meta['height'], 'source' => 'configured']);
  }

  $walkShared = function (string $dir, string $rel) use (&$walkShared, &$merged, $root, $add) {
    if (count($merged) >= STUDIO_PANO_MAX_SCAN) return;
    $items = @scandir($dir);
    if ($items === false) return;
    sort($items);
    foreach ($items as $name) {
      if (count($merged) >= STUDIO_PANO_MAX_SCAN) return;
      if ($name === '.' || $name === '..' || $name[0] === '.') continue;
      $full = "$dir/$name";
      $r = $rel === '' ? $name : "$rel/$name";
      if (is_dir($full)) {
        if (!in_array($name, STUDIO_PANO_SKIP_DIRS, true)) $walkShared($full, $r);
        continue;
      }
      $meta = studio_read_local_image_meta($root, $r);
      if ($meta !== null) $add(['path' => $r, 'width' => $meta['width'], 'height' => $meta['height'], 'source' => 'shared']);
    }
  };

  foreach (STUDIO_PANO_PUBLIC_DIRS as $pub) {
    if (count($merged) >= STUDIO_PANO_MAX_SCAN) break;
    $pubDir = "$root/" . str_replace('\\', '/', $pub);
    if (is_dir($pubDir)) $walkShared($pubDir, str_replace('\\', '/', $pub));
  }

  $out = array_values($merged);
  usort($out, function ($a, $b) {
    $order = ['configured' => 0, 'shared' => 1];
    $sa = $order[$a['source'] ?? ''] ?? 9;
    $sb = $order[$b['source'] ?? ''] ?? 9;
    if ($sa !== $sb) return $sa <=> $sb;
    return strcmp($a['path'], $b['path']);
  });
  return $out;
}

// 只加载函数、不执行请求分发（供单元测试比对三份实现的指纹算法；保持本文件单文件可部署）
if (defined('STUDIO_API_LIB_ONLY')) return;

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
      'hasPano' => studio_has_asset_file($ROOT, $d, $c['assets']['panorama'] ?? ''),
      'usesPanorama' => (($c['environment']['mode'] ?? '') === 'panorama') && studio_has_asset_file($ROOT, $d, $c['assets']['panorama'] ?? ''),
      'envMode' => $c['environment']['mode'] ?? '',
      // 背景分组只能按内容判断：路径既会误并（各展品的 assets/panorama.jpg）
      // 也会误分（同一张图复制进多个目录）
      'panoramaHash' => studio_asset_fingerprint($ROOT, $d, $c['assets']['panorama'] ?? ''),
      // 工作台按这两项做「分组 / 待完善」筛选：模型是否真在盘上、当前用的是哪套背景
      'hasModel' => studio_has_asset_file($ROOT, $d, $c['assets']['model'] ?? ''),
      'panorama' => $c['assets']['panorama'] ?? '',
      'envPreset' => $c['environment']['preset'] ?? 'room',
      'poster' => !empty($c['assets']['poster']) ? "$d/" . $c['assets']['poster'] : '',
      'mtime' => filemtime($cp) * 1000,
    ];
  }
  usort($out, fn($a, $b) => $b['mtime'] <=> $a['mtime']);
  echo json_encode([
    'exhibits' => $out,
    'panoramas' => studio_list_panorama_candidates($ROOT),
    'capabilities' => ['save' => true, 'create' => true, 'batch' => true],
  ], JSON_UNESCAPED_UNICODE); exit;
}

if ($isCheckPano) {
  $path = $_GET['path'] ?? '';
  $availability = studio_check_panorama_availability($ROOT, $path);
  $bool = $availability === 'true' ? true : ($availability === 'false' ? false : 'unknown');
  echo json_encode(['availability' => $bool, 'exists' => $availability === 'true'], JSON_UNESCAPED_UNICODE); exit;
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
