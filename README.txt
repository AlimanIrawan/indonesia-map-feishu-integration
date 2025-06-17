=== 印尼地图标注系统 ===

这是一个基于飞书多维表格的地理位置标注和地图展示系统，包含数据收集、自动同步和地图可视化功能。

== 系统架构 ==

1. 数据输入层：飞书多维表格（数据录入和存储）
2. 数据同步层：飞书自动化 + Render服务器（实时数据同步）
3. 数据存储层：CSV文件（Netlify托管）
4. 展示层：React地图应用（Netlify部署）

== 主要功能 ==

✓ 实时地理位置标注
✓ 飞书表格数据自动同步
✓ 交互式地图展示
✓ 区域边界显示
✓ 数据统计和管理
✓ 响应式设计

== 快速启动 ==

### 1. 启动本地开发环境
```
双击：启动地图应用.sh
```
自动启动虚拟环境并在浏览器打开地图应用

### 2. 启动数据同步服务
```
双击：启动飞书数据服务.sh
```
启动Render服务器，监听飞书数据推送

### 3. 推送到Render
```
双击：推送到Render.sh
```
部署最新代码到Render服务器

### 4. Git版本管理
```
双击：自动推送git.sh
```
提交代码变更并推送到GitHub

== 飞书配置 ==

### 必需字段（列名必须完全匹配）：
- 🏪 Outlet Code（门店代码）
- 📍 latitude（纬度，支持文本格式）
- 📍 longitude（经度，支持文本格式）
- 👤 nama_pemilik（店主姓名）
- 🏢 brand（品牌）
- 🌍 kecamatan（区域）
- ⭐ potensi（潜力评级）

### 自动化配置步骤：
1. 选择触发器："当记录创建时"
2. 设置HTTP推送到：https://your-render-app.onrender.com/webhook
3. 请求方式：POST
4. 请求头：Content-Type: application/json
5. 请求体：使用字段变量，不要手动输入

### 重要提醒：
- 变量必须从下拉菜单选择，不能手动输入
- 确保所有字段名称与表格列名完全一致
- 经纬度字段支持文本格式，服务器会自动转换
- Webhook端点无需身份验证，可直接推送

== 技术栈 ==

### 前端：
- React 18 + TypeScript
- Leaflet 地图组件
- Bootstrap UI框架
- Papa Parse CSV处理

### 后端：
- Node.js + Express
- Moment.js 时间处理
- Helmet 安全中间件
- Express-rate-limit 限流

### 部署：
- 前端：Netlify
- 后端：Render
- 版本控制：GitHub

== 项目结构 ==

```
indonesia-map-app/
├── src/                    # React前端源码
│   ├── App.tsx            # 主应用组件
│   ├── App.css            # 样式文件
│   └── services/          # API服务
├── public/                # 静态资源
│   ├── markers.csv        # 地点数据
│   ├── geojson/          # 地理边界数据
│   └── index.html        # HTML模板
├── feishu-webhook-server/ # 后端服务器
│   ├── server.js         # 主服务器文件
│   ├── logs/             # 日志文件
│   └── backups/          # 数据备份
├── 启动地图应用.sh        # 快速启动脚本
├── 启动飞书数据服务.sh    # 服务器启动脚本
├── 推送到Render.sh       # 部署脚本
├── 自动推送git.sh        # Git管理脚本
└── README.txt            # 本文件
```

== 环境要求 ==

- Node.js 16+
- npm或yarn
- macOS（已针对Mac优化）
- 现代浏览器（Chrome、Safari、Firefox）

== 数据格式 ==

### CSV字段说明：
- shop_code: 门店唯一标识
- latitude: 纬度（-90到90）
- longitude: 经度（-180到180）
- outlet_name: 门店名称
- brand: 品牌信息
- kecamatan: 所属区域
- potensi: 商业潜力评级

### 支持的坐标格式：
- 数字：-6.2, 106.8
- 文本："-6.2", "106.8"
- 带前缀："纬度:-6.2", "latitude:-6.2"

== 系统端点 ==

### 公开访问端点（无需验证）：
- /webhook - 飞书自动化数据推送
- /admin - CSV数据管理界面
- /api/data/csv - 获取CSV数据
- /api/status - 服务器状态
- /health - 健康检查

== 故障排除 ==

### 常见问题：

1. **飞书数据推送失败**
   - 检查自动化配置是否正确
   - 确认变量是从下拉菜单选择
   - 检查Render服务器状态

2. **地图不显示数据**
   - 检查CSV文件是否更新
   - 确认Netlify部署状态
   - 查看浏览器控制台错误

3. **坐标格式错误**
   - 确保经纬度在有效范围内
   - 检查字段名称是否匹配
   - 查看服务器日志详情

4. **服务器连接问题**
   - 检查Render服务器状态
   - 确认webhook URL正确
   - 查看网络连接是否正常

### 日志查看：
- 服务器日志：feishu-webhook-server/logs/
- Render日志：登录Render控制台查看
- 浏览器日志：F12开发者工具

== 联系信息 ==

如有问题或建议，请通过GitHub Issues反馈。

项目地址：https://github.com/your-username/indonesia-map-app
在线演示：https://locationmarker.netlify.app

== 更新日志 ==

v1.1.0 (2025-01-16)
- 简化部署流程，移除API密钥要求
- 优化飞书自动化集成
- 改进错误处理和日志记录

v1.0.0 (2025-01-16)
- 基础地图展示功能
- 飞书数据同步集成
- CSV数据管理
- 响应式设计

== 开发说明 ==

### 本地开发：
```bash
npm install
npm start
```

### 构建部署：
```bash
npm run build
```

### 服务器开发：
```bash
cd feishu-webhook-server
npm install
npm start
```

== 许可证 ==

MIT License - 详见项目根目录LICENSE文件 