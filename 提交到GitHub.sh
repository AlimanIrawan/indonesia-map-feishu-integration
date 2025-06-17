#!/bin/bash

echo "🚀 准备提交飞书中转服务器到GitHub"
echo "================================"

# 检查git状态
if ! git status &> /dev/null; then
    echo "📦 初始化Git仓库..."
    git init
    
    echo "🔗 请输入你的GitHub仓库地址："
    echo "格式：https://github.com/用户名/仓库名.git"
    read -p "仓库地址: " repo_url
    
    if [ -n "$repo_url" ]; then
        git remote add origin "$repo_url"
        echo "✅ 已添加远程仓库: $repo_url"
    else
        echo "❌ 未提供仓库地址，请手动添加远程仓库"
    fi
fi

echo ""
echo "📝 添加文件到Git..."
git add .

echo ""
echo "💾 提交更改..."
git commit -m "添加飞书GitHub中转服务器

- 中转服务器代码 (feishu-proxy-server.js)
- Render部署配置
- 启动脚本和说明文档
- 解决飞书HTTP请求响应格式问题"

echo ""
echo "🚀 推送到GitHub..."
git push -u origin main 2>/dev/null || git push -u origin master 2>/dev/null || {
    echo "⚠️  推送失败，可能需要先创建分支"
    echo "尝试推送到main分支..."
    git branch -M main
    git push -u origin main
}

echo ""
echo "✅ 提交完成！"
echo "📱 现在可以到 https://render.com 部署服务器了"
echo ""
echo "🔗 部署步骤："
echo "1. 访问 https://render.com"
echo "2. 使用GitHub登录"
echo "3. 创建新的Web Service"
echo "4. 选择这个仓库"
echo "5. 按照配置说明进行设置" 