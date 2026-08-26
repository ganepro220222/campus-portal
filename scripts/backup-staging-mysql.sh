#!/usr/bin/env bash
# staging ECS：MySQL 全库备份（cron 或手动）
#
# 用法（/opt/shuyuan 下）：
#   bash scripts/backup-staging-mysql.sh
#
# cron 示例（每天 03:15）：
#   15 3 * * * root cd /opt/shuyuan && bash scripts/backup-staging-mysql.sh >> /var/log/shuyuan-mysql-backup.log 2>&1
#
# 环境变量：
#   BACKUP_DIR=backup          输出目录（相对仓库根）
#   BACKUP_KEEP_DAYS=14        保留天数
#   DOCKER_COMPOSE_FILE=...    默认 docker-compose.staging.yml

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BACKUP_DIR="${BACKUP_DIR:-backup}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
COMPOSE_FILE="${DOCKER_COMPOSE_FILE:-docker-compose.staging.yml}"
STAMP="$(date +%Y%m%d_%H%M%S)"
OUT="$BACKUP_DIR/shuyuan_${STAMP}.sql"

if [ ! -f .env ]; then
  echo "错误: 缺少 $ROOT/.env" >&2
  exit 1
fi

DB_USERNAME="$(grep '^DB_USERNAME=' .env | cut -d= -f2- | tr -d '\r')"
DB_PASSWORD="$(grep '^DB_PASSWORD=' .env | cut -d= -f2- | tr -d '\r')"

if [ -z "$DB_USERNAME" ] || [ -z "$DB_PASSWORD" ]; then
  echo "错误: .env 缺少 DB_USERNAME / DB_PASSWORD" >&2
  exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "错误: 未找到 $COMPOSE_FILE" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "=== backup-staging-mysql @ $ROOT ==="
echo "compose: $COMPOSE_FILE"
echo "output:  $OUT"

docker compose -f "$COMPOSE_FILE" exec -T mysql \
  mysqldump -u"$DB_USERNAME" -p"$DB_PASSWORD" --single-transaction --routines --triggers \
  --default-character-set=utf8mb4 shuyuan > "$OUT"

bytes="$(wc -c < "$OUT" | tr -d ' ')"
if [ "$bytes" -lt 1024 ]; then
  echo "错误: 备份过小 (${bytes} bytes)，可能失败" >&2
  exit 1
fi

echo "OK  size=$(du -h "$OUT" | cut -f1)"

find "$BACKUP_DIR" -maxdepth 1 -name 'shuyuan_*.sql' -mtime +"$KEEP_DAYS" -delete 2>/dev/null || true
echo "完成（保留 ${KEEP_DAYS} 天内备份）"
