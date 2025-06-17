const express = require('express');
const app = express();

app.use(express.json());

// 允许跨域
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    next();
});

// 中转接口
app.post('/feishu-to-github', async (req, res) => {
    try {
        console.log('🚀 收到飞书请求:', JSON.stringify(req.body, null, 2));
        
        // 动态导入fetch
        const fetch = (await import('node-fetch')).default;
        
        // 调用GitHub API
        const response = await fetch('https://api.github.com/repos/AlimanIrawan/indonesia-map-feishu-integration/dispatches', {
            method: 'POST',
            headers: {
                'Authorization': 'token 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',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        
        console.log('📡 GitHub API响应状态:', response.status);
        
        if (response.status === 204) {
            // 返回飞书期望的JSON响应
            const successResponse = {
                success: true,
                message: 'GitHub Actions触发成功',
                status: 204,
                timestamp: new Date().toISOString(),
                data: req.body
            };
            console.log('✅ 返回成功响应:', successResponse);
            res.json(successResponse);
        } else {
            const errorText = await response.text();
            console.error('❌ GitHub API错误:', errorText);
            res.status(200).json({
                success: false,
                error: `GitHub API调用失败: ${response.status}`,
                details: errorText,
                timestamp: new Date().toISOString()
            });
        }
        
    } catch (error) {
        console.error('❌ 服务器错误:', error);
        res.status(200).json({
            success: false,
            error: '服务器内部错误',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: '飞书GitHub中转服务',
        timestamp: new Date().toISOString() 
    });
});

// 根路径
app.get('/', (req, res) => {
    res.json({
        service: '飞书GitHub中转服务器',
        version: '1.0.0',
        endpoints: {
            'POST /feishu-to-github': '飞书数据中转到GitHub',
            'GET /health': '健康检查'
        },
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 飞书中转服务器启动在端口 ${PORT}`);
    console.log(`📡 服务地址: http://localhost:${PORT}`);
    console.log(`🔗 中转接口: http://localhost:${PORT}/feishu-to-github`);
}); 