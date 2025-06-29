const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 日志函数
function log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
}

// GitHub API调用函数
async function triggerGitHubActions(markerData) {
    try {
        log('开始调用GitHub API触发Actions');
        
        // 调试：检查环境变量
        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            log('❌ GITHUB_TOKEN环境变量未设置');
            return { success: false, error: 'GITHUB_TOKEN环境变量未设置' };
        }
        
        log(`🔑 Token前缀: ${token.substring(0, 10)}...`);
        log(`🔑 Token长度: ${token.length}`);
        
        // 使用动态import来导入node-fetch
        const fetch = (await import('node-fetch')).default;
        
        const response = await fetch('https://api.github.com/repos/AlimanIrawan/indonesia-map-feishu-integration/dispatches', {
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'feishu-webhook-server'
            },
            body: JSON.stringify({
                event_type: 'feishu_update',
                client_payload: {
                    shop_code: markerData.shop_code,
                    latitude: markerData.latitude.toString(),
                    longitude: markerData.longitude.toString(),
                    outlet_name: markerData.outlet_name
                }
            })
        });
        
        if (response.ok) {
            log('✅ GitHub Actions触发成功');
            return { success: true };
        } else {
            const errorText = await response.text();
            log(`❌ GitHub Actions触发失败: ${response.status} - ${errorText}`);
            return { success: false, error: `GitHub API错误: ${response.status}` };
        }
    } catch (error) {
        log(`❌ GitHub API调用出错: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// 健康检查端点
app.get('/', (req, res) => {
    log('健康检查请求');
    res.json({ 
        status: 'ok', 
        message: '飞书Webhook服务器运行正常',
        timestamp: new Date().toISOString()
    });
});

// 接收飞书数据的webhook端点
app.post('/webhook', async (req, res) => {
    try {
        log('收到飞书webhook请求');
        log(`请求数据: ${JSON.stringify(req.body, null, 2)}`);
        
        const data = req.body;
        
        // 验证数据格式 - 统一使用四个字段
        if (!data || !data.shop_code || !data.latitude || !data.longitude || !data.outlet_name) {
            log('数据格式不正确');
            return res.status(400).json({
                success: false,
                error: '数据格式不正确，需要包含 shop_code, latitude, longitude, outlet_name'
            });
        }
        
        // 准备地点数据 - 统一字段格式
        const markerData = {
            id: Date.now(),
            shop_code: data.shop_code,
            latitude: parseFloat(data.latitude),
            longitude: parseFloat(data.longitude),
            outlet_name: data.outlet_name,
            timestamp: new Date().toISOString()
        };
        
        log(`处理地点数据: ${JSON.stringify(markerData, null, 2)}`);
        
        // 读取现有的markers.json
        let markers = [];
        const markersPath = path.join(__dirname, '..', 'data', 'markers.json');
        
        try {
            if (fs.existsSync(markersPath)) {
                const markersContent = fs.readFileSync(markersPath, 'utf8');
                markers = JSON.parse(markersContent);
                log(`读取到现有标记数量: ${markers.length}`);
            } else {
                log('markers.json文件不存在，将创建新文件');
                // 确保data目录存在
                const dataDir = path.dirname(markersPath);
                if (!fs.existsSync(dataDir)) {
                    fs.mkdirSync(dataDir, { recursive: true });
                    log('创建data目录');
                }
            }
        } catch (error) {
            log(`读取markers.json出错: ${error.message}`);
            markers = [];
        }
        
        // 检查是否已存在相同shop_code的记录
        const existingIndex = markers.findIndex(marker => marker.shop_code === data.shop_code);
        if (existingIndex !== -1) {
            // 更新现有记录
            markers[existingIndex] = markerData;
            log(`更新现有记录: ${data.shop_code}`);
        } else {
            // 添加新标记
            markers.push(markerData);
            log(`添加新记录: ${data.shop_code}`);
        }
        
        // 写入更新后的数据
        try {
            fs.writeFileSync(markersPath, JSON.stringify(markers, null, 2), 'utf8');
            log(`成功写入markers.json，总标记数量: ${markers.length}`);
        } catch (error) {
            log(`写入markers.json出错: ${error.message}`);
            return res.status(500).json({
                success: false,
                error: '写入数据文件失败'
            });
        }
        
        // 触发GitHub Actions
        log('触发GitHub Actions更新CSV文件');
        const githubResult = await triggerGitHubActions(markerData);
        
        // 返回成功响应
        const response = {
            success: true,
            message: '地点数据已成功添加',
            data: markerData,
            totalMarkers: markers.length,
            github: githubResult
        };
        
        log(`响应数据: ${JSON.stringify(response, null, 2)}`);
        res.json(response);
        
    } catch (error) {
        log(`处理webhook请求出错: ${error.message}`);
        res.status(500).json({
            success: false,
            error: '服务器内部错误',
            details: error.message
        });
    }
});

// 获取所有标记的端点
app.get('/markers', (req, res) => {
    try {
        const markersPath = path.join(__dirname, '..', 'data', 'markers.json');
        
        if (fs.existsSync(markersPath)) {
            const markersContent = fs.readFileSync(markersPath, 'utf8');
            const markers = JSON.parse(markersContent);
            log(`返回标记数量: ${markers.length}`);
            res.json({
                success: true,
                data: markers,
                count: markers.length
            });
        } else {
            log('markers.json文件不存在');
            res.json({
                success: true,
                data: [],
                count: 0
            });
        }
    } catch (error) {
        log(`获取标记出错: ${error.message}`);
        res.status(500).json({
            success: false,
            error: '获取标记数据失败'
        });
    }
});

// 启动服务器
app.listen(PORT, () => {
    log(`服务器启动成功，端口: ${PORT}`);
    log(`服务器运行在 Render 云平台`);
    log(`健康检查端点: GET /`);
    log(`Webhook端点: POST /webhook`);
    log(`标记查询端点: GET /markers`);
}); 