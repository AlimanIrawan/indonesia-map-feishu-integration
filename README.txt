🗺️ 印尼地图标注系统 - 完整部署指南
======================================

📋 系统概述
----------
这是一个完整的地图标注系统，支持：
- 飞书多维表格数据自动推送
- Render服务器数据处理和存储
- Netlify静态网站地图显示
- 网页端CSV数据管理界面

🔄 数据流程
----------
1. 飞书多维表格 → 自动化推送 → Render服务器Webhook
2. Render服务器 → 更新CSV文件 → 提供API访问
3. Netlify网站 → 读取Render的CSV → 显示地图标记
4. 管理员 → CSV管理界面 → 手动编辑数据

🌐 系统地址
----------
- 地图网站：https://idpop-map.netlify.app/
- 数据管理：https://indonesia-map-feishu-integration.onrender.com/admin
- Webhook地址：https://indonesia-map-feishu-integration.onrender.com/webhook
- API数据：https://indonesia-map-feishu-integration.onrender.com/api/data/csv

🛠️ 核心功能
----------

【地图系统】
- 印尼地图显示，支持卫星图和普通地图切换
- 多品牌门店标记，颜色区分不同品牌
- 有潜力店铺特殊标记（金色边框）
- 区域筛选功能
- 实时数据更新（30秒检查一次）
- 统计面板显示各品牌门店数量

【数据管理】
- 网页界面查看和编辑CSV数据
- 自动备份功能
- 一键清空数据
- Webhook测试功能
- 数据统计显示

【自动化集成】
- 飞书表格新增记录自动推送
- 服务器实时处理数据
- 地图自动更新显示

📝 文件结构
----------
项目根目录/
├── src/                          # React应用源码
│   ├── App.tsx                   # 主应用组件
│   ├── App.css                   # 样式文件
│   └── logo.js                   # Logo图片
├── public/                       # 静态资源
│   └── markers.csv              # 地图标记数据（已清空，使用Render数据）
├── feishu-webhook-server/        # 服务器代码
│   ├── server.js                # 主服务器文件
│   ├── package.json             # 依赖配置
│   └── 启动CSV管理界面.sh        # 本地管理界面启动脚本
├── 快速提交到Git.sh             # Git提交脚本
├── 清空CSV数据.js               # 数据清空工具
├── CSV数据管理说明.txt          # 管理界面详细说明
└── README.txt                   # 本文件

🔧 部署状态
----------
✅ Netlify网站已部署：强制从Render读取数据
✅ Render服务器已部署：包含Webhook和管理界面
✅ 飞书自动化：需要在飞书中配置（见配置指南）
✅ CSV管理界面：已上线，支持数据编辑

📊 数据格式
----------
CSV标准格式：
shop_code,latitude,longitude,outlet name,brand,kecamatan,potensi

字段说明：
- shop_code: 店铺编号（12位数字）
- latitude: 纬度（南纬用负数）
- longitude: 经度
- outlet name: 店铺名称
- brand: 品牌名称（支持：halocoko, Aice, Campina, Walls, Joyday, glico, Diamond, Other）
- kecamatan: 区域名称
- potensi: 潜力标记（填写"potensi"表示有潜力店铺）

🎯 使用方式
----------

【查看地图】
1. 访问：https://idpop-map.netlify.app/
2. 输入区域名称和密码（omg20250501）
3. 查看地图上的门店标记

【管理数据】
1. 访问：https://indonesia-map-feishu-integration.onrender.com/admin
2. 点击"加载CSV数据"查看当前数据
3. 在文本框中编辑CSV内容
4. 点击"保存CSV数据"保存更改
5. 地图会在30秒内自动更新

【飞书集成】
1. 在飞书多维表格中配置自动化
2. 新记录时POST发送到Webhook地址
3. 数据格式：{record: {fields: {...}}}
4. 服务器自动处理并更新CSV

⚠️ 重要说明
----------
1. 地图系统已配置为强制从Render服务器读取数据
2. 本地CSV文件已清空，不再使用
3. 所有数据修改都会自动创建备份
4. 修改数据前建议先下载备份
5. 系统支持实时数据同步

🔍 故障排除
----------
1. 地图不显示数据 → 检查Render服务器状态
2. 数据不更新 → 等待30秒自动检测
3. 管理界面无法访问 → 检查Render部署状态
4. 飞书推送失败 → 检查Webhook配置和数据格式

💡 优化特性
----------
- 自动备份：每次修改前自动创建备份
- 实时同步：30秒检查数据更新
- 错误处理：详细的错误信息显示
- 用户体验：直观的界面和操作提示
- 安全性：密码保护和数据验证

📈 系统优势
----------
1. 无需手动上传文件
2. 支持实时数据更新
3. 完全脱离本地文件依赖
4. 支持多人协作编辑
5. 自动备份防止数据丢失
6. 简单易用的网页界面

🎉 部署完成
----------
系统已完全部署并可正常使用！
所有组件都已配置为生产环境，支持自动化数据流和手动管理。 