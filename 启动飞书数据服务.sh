#!/bin/bash

# 飞书数据接收服务启动脚本

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_DIR="$SCRIPT_DIR/feishu-webhook-server"

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

echo "====================================================="
print_green "飞书数据接收服务启动器"
echo "====================================================="

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
  print_red "错误: 未找到Node.js，请先安装Node.js"
  echo "建议访问 https://nodejs.org/ 下载安装"
  echo "按任意键退出..."
  read -n 1
  exit 1
fi

print_green "✓ Node.js版本: $(node --version)"

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
  print_red "错误: 未找到npm"
  echo "按任意键退出..."
  read -n 1
  exit 1
fi

print_green "✓ npm版本: $(npm --version)"

# 检查服务目录是否存在
if [ ! -d "$SERVICE_DIR" ]; then
  print_red "错误: 服务目录不存在: $SERVICE_DIR"
  echo "按任意键退出..."
  read -n 1
  exit 1
fi

print_green "✓ 服务目录: $SERVICE_DIR"

# 进入服务目录
cd "$SERVICE_DIR" || exit 1

# 检查package.json是否存在
if [ ! -f "package.json" ]; then
  print_red "错误: 未找到package.json文件"
  echo "按任意键退出..."
  read -n 1
  exit 1
fi

print_green "✓ 找到package.json文件"

# 检查并安装依赖
print_yellow "正在检查Node.js依赖..."

if [ ! -d "node_modules" ]; then
  print_yellow "首次运行，正在安装依赖包..."
  print_yellow "这可能需要几分钟时间，请耐心等待..."
  
  npm install
  
  if [ $? -eq 0 ]; then
    print_green "✓ 依赖包安装完成"
  else
    print_red "❌ 依赖包安装失败"
    echo "请检查网络连接或手动运行: npm install"
    echo "按任意键退出..."
    read -n 1
    exit 1
  fi
else
  print_green "✓ 依赖包已存在"
  
  # 检查是否需要更新依赖
  print_yellow "检查依赖更新..."
  npm outdated > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    print_yellow "有依赖包需要更新，正在更新..."
    npm update
  fi
fi

# 检查环境配置文件
if [ ! -f ".env" ]; then
  if [ -f "env_example.txt" ]; then
    print_yellow "创建环境配置文件..."
    cp env_example.txt .env
    print_yellow "⚠️  请修改.env文件中的API_TOKEN设置"
  else
    print_yellow "⚠️  未找到环境配置文件，将使用默认设置"
  fi
fi

# 检查端口是否被占用
PORT=3001
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
  print_yellow "⚠️  端口$PORT已被占用"
  print_yellow "正在尝试终止占用进程..."
  
  # 获取占用端口的进程PID
  PID=$(lsof -ti:$PORT)
  if [ ! -z "$PID" ]; then
    kill -9 $PID 2>/dev/null
    sleep 2
    
    # 再次检查端口
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
      print_red "❌ 无法释放端口$PORT，请手动处理"
      echo "请运行: lsof -ti:$PORT | xargs kill -9"
      echo "按任意键退出..."
      read -n 1
      exit 1
    else
      print_green "✓ 端口$PORT已释放"
    fi
  fi
fi

# 创建必要的目录
mkdir -p logs backups

print_green "✓ 环境检查完成"
echo ""
print_green "🚀 正在启动飞书数据接收服务..."
echo ""

# 启动服务
node server.js &
SERVER_PID=$!

# 等待服务启动
sleep 3

# 检查服务是否正常启动
if ps -p $SERVER_PID > /dev/null 2>&1; then
  print_green "✅ 服务启动成功!"
  echo ""
  print_green "📡 服务地址: http://localhost:3001"
  print_green "📝 Webhook地址: http://localhost:3001/api/feishu/webhook"
  print_green "📊 状态查询: http://localhost:3001/api/status"
  print_green "🔍 健康检查: http://localhost:3001/health"
  echo ""
  print_yellow "💡 提示："
  echo "- 服务正在后台运行，进程ID: $SERVER_PID"
  echo "- 日志文件位置: $SERVICE_DIR/logs/"
  echo "- 备份文件位置: $SERVICE_DIR/backups/"
  echo "- 按Ctrl+C可以停止服务"
  echo ""
  
  # 运行简单测试
  print_yellow "🧪 正在运行连接测试..."
  sleep 2
  
  if command -v curl &> /dev/null; then
    HEALTH_CHECK=$(curl -s http://localhost:3001/health 2>/dev/null)
    if [ $? -eq 0 ]; then
      print_green "✅ 服务连接正常"
    else
      print_yellow "⚠️  服务连接测试失败，但服务可能仍在启动中"
    fi
  else
    print_yellow "⚠️  未安装curl，跳过连接测试"
  fi
  
  echo ""
  print_green "🎉 飞书数据接收服务已准备就绪！"
  echo ""
  print_yellow "请参考'飞书配置指南.txt'文件配置飞书端的自动化流程"
  echo ""
  
  # 保持脚本运行，等待用户中断
  echo "按Ctrl+C停止服务，或直接关闭此窗口"
  
  # 捕获中断信号
  trap 'echo ""; print_yellow "正在停止服务..."; kill $SERVER_PID 2>/dev/null; print_green "服务已停止"; exit 0' INT
  
  # 等待服务进程结束
  wait $SERVER_PID
  
else
  print_red "❌ 服务启动失败"
  echo "请检查错误信息或查看日志文件"
  echo "按任意键退出..."
  read -n 1
  exit 1
fi 