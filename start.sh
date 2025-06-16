#!/bin/bash

# 创建Python虚拟环境(如果不存在)
if [ ! -d "venv" ]; then
  echo "创建虚拟环境..."
  python3 -m venv venv
fi

# 激活虚拟环境
source venv/bin/activate

# 检查npm是否已安装
if ! command -v npm &> /dev/null; then
  echo "npm未安装，请先安装Node.js"
  exit 1
fi

# 创建GeoJSON目录(如果不存在)
if [ ! -d "public/geojson" ]; then
  echo "创建GeoJSON目录..."
  mkdir -p public/geojson
  
  # 创建默认的regions-list.json文件(如果不存在)
  if [ ! -f "public/geojson/regions-list.json" ]; then
    echo '{
  "regions": []
}' > public/geojson/regions-list.json
    echo "已创建默认的regions-list.json文件"
  fi
fi

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
  echo "安装依赖..."
  npm install
fi

# 清除浏览器缓存(可选，但有助于确保CSV文件被重新加载)
echo "正在为您准备启动应用..."
sleep 1

# 启动应用
echo "启动应用中，请稍候..."
open http://localhost:3000 && npm start 