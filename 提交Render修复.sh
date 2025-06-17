#!/bin/bash

echo "=== 提交Render服务修复代码 ==="

# 添加所有更改
git add .

# 提交更改
git commit -m "修复: 重新创建feishu-webhook-server服务器代码

- 创建完整的server.js文件
- 包含详细的日志系统
- 支持飞书数据接收和处理
- 自动创建data目录和markers.json
- 提供健康检查和标记查询端点"

# 推送到远程仓库
git push origin main

echo "=== 代码提交完成 ==="
echo "Render将自动检测到代码更新并重新部署"
echo "请等待几分钟让Render完成部署" 