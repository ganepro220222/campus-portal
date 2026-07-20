#!/usr/bin/env bash
# 停止 exhibits 本地服务（Git Bash）
PORT="${1:-8199}"
echo "Stopping processes on port $PORT ..."
found=0
while read -r line; do
  pid=$(echo "$line" | awk '{print $NF}')
  if [[ "$pid" =~ ^[0-9]+$ ]]; then
    echo "  kill PID $pid"
    taskkill //PID "$pid" //F 2>/dev/null || kill "$pid" 2>/dev/null
    found=1
  fi
done < <(netstat -ano 2>/dev/null | grep ":$PORT .*LISTENING")
if [[ "$found" -eq 0 ]]; then
  echo "No process found on port $PORT."
else
  echo "Done."
fi
