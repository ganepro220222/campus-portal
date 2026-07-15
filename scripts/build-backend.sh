#!/usr/bin/env bash
# 本仓库 Spring Boot 3 需要 Java 17；Git Bash 默认 PATH 可能指向 JDK 8。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
JAVA17="/c/Program Files/Java/jdk-17.0.18"

if [[ ! -d "$JAVA17" ]]; then
  echo "未找到 JDK 17: $JAVA17" >&2
  echo "请安装 JDK 17 或修改 scripts/build-backend.sh 中的 JAVA17 路径。" >&2
  exit 1
fi

export JAVA_HOME="$JAVA17"
export PATH="$JAVA_HOME/bin:$PATH"

echo "JAVA_HOME=$JAVA_HOME"
java -version

cd "$ROOT/backend"
mvn -DskipTests package "$@"
