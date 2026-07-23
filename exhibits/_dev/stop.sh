#!/usr/bin/env bash
# Git Bash — Windows 请用 停止服务.bat
PORT="${1:-8199}"
found=0
while read -r line; do
  pid=$(echo "$line" | awk '{print $NF}')
  if [[ "$pid" =~ ^[0-9]+$ ]]; then
    taskkill //PID "$pid" //F 2>/dev/null || kill "$pid" 2>/dev/null
    found=1
  fi
done < <(netstat -ano 2>/dev/null | grep ":$PORT .*LISTENING" || true)
[[ "$found" -eq 0 ]] && echo "nothing on $PORT" || echo "stopped"
