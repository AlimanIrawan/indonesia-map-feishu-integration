#!/bin/bash

# 印尼地图标注应用自动部署脚本
# 此脚本用于在修改markers.csv或GeoJSON文件后快速部署到Netlify

# 自定义站点名称
SITE_NAME="locationmarker"

# 颜色输出函数
print_green() {
  echo -e "\033[32m$1\033[0m"
}

print_yellow() {
  echo -e "\033[33m$1\033[0m"
}

print_red() {
  echo -e "\033[31m$1\033[0m"
}

# 显示欢迎信息
echo "====================================================="
print_green "印尼地图标注应用 - Netlify自动部署工具"
echo "====================================================="
echo ""

# 检查是否安装了必要的工具
if ! command -v npm &> /dev/null; then
  print_red "错误: 未找到npm，请先安装Node.js"
  echo "按任意键退出..."
  read -n 1
  exit 1
fi

if ! command -v npx &> /dev/null; then
  print_red "错误: 未找到npx，请先安装Node.js"
  echo "按任意键退出..."
  read -n 1
  exit 1
fi

# 检查是否安装了netlify-cli
if ! command -v netlify &> /dev/null; then
  print_yellow "未安装Netlify CLI，正在安装..."
  npm install -g netlify-cli
  
  if [ $? -ne 0 ]; then
    print_red "安装Netlify CLI失败，请手动安装: npm install -g netlify-cli"
    echo "按任意键退出..."
    read -n 1
    exit 1
  fi
  print_green "Netlify CLI安装成功！"
fi

# 切换到项目目录
cd "$(dirname "$0")"

# 检查markers.csv是否存在
if [ ! -f "public/markers.csv" ]; then
  print_red "错误: 未找到markers.csv文件"
  echo "请确保markers.csv文件位于public文件夹中"
  echo "按任意键退出..."
  read -n 1
  exit 1
fi

# 检查GeoJSON目录是否存在，如果不存在则创建
if [ ! -d "public/geojson" ]; then
  print_yellow "未找到GeoJSON目录，正在创建..."
  mkdir -p public/geojson
  print_green "GeoJSON目录创建成功！"
fi

# 检查regions-list.json是否存在，如果不存在则创建默认文件
if [ ! -f "public/geojson/regions-list.json" ]; then
  print_yellow "未找到regions-list.json文件，正在创建默认文件..."
  echo '{
  "regions": []
}' > public/geojson/regions-list.json
  print_green "默认regions-list.json文件创建成功！"
fi

# 检查是否有GeoJSON文件，如果有则确保它们被列在regions-list.json中
# 使用更安全的方式提取GeoJSON文件名，保留包含空格的完整名称
GEOJSON_FILES=()
while IFS= read -r file; do
  # 提取文件名并移除.geojson后缀
  filename=$(basename "$file" .geojson)
  GEOJSON_FILES+=("$filename")
done < <(find public/geojson -name "*.geojson" -type f)

if [ ${#GEOJSON_FILES[@]} -gt 0 ]; then
  print_yellow "检测到以下GeoJSON文件："
  for region in "${GEOJSON_FILES[@]}"; do
    echo "- $region"
  done
  
  # 创建一个新的regions-list.json文件，确保格式正确
  print_yellow "正在更新regions-list.json文件..."
  echo '{' > public/geojson/regions-list.json.new
  echo '  "regions": [' >> public/geojson/regions-list.json.new
  
  # 添加所有区域
  for i in "${!GEOJSON_FILES[@]}"; do
    region="${GEOJSON_FILES[$i]}"
    # 处理JSON转义
    escaped_region=$(echo "$region" | sed 's/\\/\\\\/g; s/"/\\"/g')
    
    if [ $i -eq 0 ]; then
      # 第一个元素前不加逗号
      echo "    \"$escaped_region\"" >> public/geojson/regions-list.json.new
    else
      # 其他元素前加逗号
      echo "    ,\"$escaped_region\"" >> public/geojson/regions-list.json.new
    fi
  done
  
  echo '  ]' >> public/geojson/regions-list.json.new
  echo '}' >> public/geojson/regions-list.json.new
  
  # 替换旧文件
  mv public/geojson/regions-list.json.new public/geojson/regions-list.json
  print_green "已更新regions-list.json文件，确保格式正确并保留完整区域名称。"
fi

print_yellow "正在构建应用..."
# 构建应用
npm run build

if [ $? -ne 0 ]; then
  print_red "构建失败，请检查错误信息"
  echo "按任意键退出..."
  read -n 1
  exit 1
fi

print_green "构建成功！"
print_yellow "准备部署到Netlify站点: ${SITE_NAME}.netlify.app"

# 检查是否已登录Netlify
netlify status &> /dev/null
if [ $? -ne 0 ]; then
  print_yellow "您尚未登录Netlify，正在打开登录页面..."
  netlify login
  
  if [ $? -ne 0 ]; then
    print_red "Netlify登录失败"
    echo "按任意键退出..."
    read -n 1
    exit 1
  fi
fi

# 查找指定站点
print_yellow "查找站点: ${SITE_NAME}.netlify.app"
SITE_ID=$(netlify sites:list --json 2>/dev/null | grep -o "\"name\":\"${SITE_NAME}\"[^}]*\"id\":\"[^\"]*\"" | grep -o "\"id\":\"[^\"]*\"" | cut -d'"' -f4)

if [ -z "$SITE_ID" ]; then
  print_yellow "未找到站点: ${SITE_NAME}.netlify.app，尝试使用site-id查找..."
  # 尝试直接使用站点名称部署
  netlify deploy --dir=build --prod --site="${SITE_NAME}"
  
  if [ $? -ne 0 ]; then
    print_yellow "无法直接使用站点名称部署，正在创建站点..."
    netlify sites:create --name "${SITE_NAME}"
    
    if [ $? -ne 0 ]; then
      print_red "创建Netlify站点失败"
      echo "按任意键退出..."
      read -n 1
      exit 1
    fi
    
    SITE_ID=$(netlify sites:list --json | grep -o "\"name\":\"${SITE_NAME}\"[^}]*\"id\":\"[^\"]*\"" | grep -o "\"id\":\"[^\"]*\"" | cut -d'"' -f4)
    print_green "成功创建新站点：${SITE_NAME}.netlify.app"
  else
    print_green "成功部署到站点：${SITE_NAME}.netlify.app"
    print_green "您的地图应用已更新，刷新网站即可看到最新内容。"
    echo ""
    echo "按任意键退出..."
    read -n 1
    exit 0
  fi
else
  print_green "找到站点ID: $SITE_ID"
fi

# 部署到Netlify
print_yellow "正在部署到Netlify站点: ${SITE_NAME}.netlify.app"
netlify deploy --dir=build --prod --site="$SITE_ID"

if [ $? -ne 0 ]; then
  print_red "部署失败，请检查错误信息"
  echo "按任意键退出..."
  read -n 1
  exit 1
fi

print_green "部署成功！"
print_green "您的地图应用已更新，刷新网站 ${SITE_NAME}.netlify.app 即可看到最新内容。"
echo ""
echo "按任意键退出..."
read -n 1
exit 0 