const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: false // 为了兼容性暂时禁用
}));
app.use(cors());

// 限流中间件
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP每15分钟最多100个请求
});
app.use('/api/', limiter);

// 解析JSON数据
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 统计信息
const stats = {
  totalRequests: 0,
  successfulUpdates: 0,
  errorCount: 0,
  lastUpdate: null,
  startTime: new Date().toISOString()
};

// 配置文件路径
const CONFIG = {
  csvPath: path.join(__dirname, '../public/data/outlets.csv'),
  backupDir: path.join(__dirname, 'backups'),
  logDir: path.join(__dirname, 'logs'),
  apiToken: process.env.API_TOKEN || 'your-super-secret-token'
};

// 确保目录存在
function ensureDirectories() {
  if (!fs.existsSync(CONFIG.backupDir)) {
    fs.mkdirSync(CONFIG.backupDir, { recursive: true });
  }
  if (!fs.existsSync(CONFIG.logDir)) {
    fs.mkdirSync(CONFIG.logDir, { recursive: true });
  }
  
  // 确保数据目录存在
  const dataDir = path.dirname(CONFIG.csvPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// 日志记录功能
function writeLog(level, message, data = null) {
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
  const logEntry = {
    timestamp,
    level,
    message,
    data
  };
  
  const logContent = JSON.stringify(logEntry) + '\n';
  const logFile = path.join(CONFIG.logDir, `feishu-webhook-${moment().format('YYYY-MM-DD')}.log`);
  
  // 异步写入日志文件
  fs.appendFile(logFile, logContent, (err) => {
    if (err) console.error('写入日志失败:', err);
  });
  
  // 同时输出到控制台
  console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, data || '');
}

// 解析CSV内容
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  if (lines.length <= 1) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row = {};
    
    headers.forEach((header, index) => {
      let value = values[index] || '';
      // 移除引号
      value = value.replace(/^"|"$/g, '').trim();
      row[header] = value;
    });
    
    data.push(row);
  }
  
  return data;
}

// 数据验证函数
function validateData(data) {
  // 检查必填字段
  const requiredFields = ['outlet_code', 'latitude', 'longitude', 'nama_pemilik'];
  
  for (const field of requiredFields) {
    if (!data[field] || data[field].toString().trim() === '') {
      return { valid: false, error: `缺少必填字段: ${field}` };
    }
  }

  // 验证经纬度格式
  const lat = parseFloat(data.latitude);
  const lng = parseFloat(data.longitude);
  
  if (isNaN(lat) || lat < -90 || lat > 90) {
    return { valid: false, error: '纬度格式错误，必须在-90到90之间' };
  }
  
  if (isNaN(lng) || lng < -180 || lng > 180) {
    return { valid: false, error: '经度格式错误，必须在-180到180之间' };
  }

  return { valid: true };
}

// 转换数据格式以兼容现有CSV结构
function convertToCSVFormat(data) {
  return {
    shop_code: data.outlet_code || '',
    latitude: parseFloat(data.latitude) || 0,
    longitude: parseFloat(data.longitude) || 0,
    outlet_name: data.nama_pemilik || '',
    brand: 'Other',  // 默认品牌
    kecamatan: 'Unknown',  // 默认区域
    potensi: ''  // 默认无潜力标记
  };
}

// 认证中间件
function authenticateToken(req, res, next) {
  const token = req.headers['authorization'] || req.body.token;
  
  if (!token || (token !== CONFIG.apiToken && token !== `Bearer ${CONFIG.apiToken}`)) {
    writeLog('warn', '无效的API token', { token, ip: req.ip });
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  
  next();
}

// 飞书单条数据接收接口
app.post('/api/feishu/webhook', authenticateToken, async (req, res) => {
  try {
    const { data } = req.body;
    
    writeLog('info', '收到飞书推送数据', JSON.stringify(data));
    
    // 验证数据
    const validation = validateData(data);
    if (!validation.valid) {
      writeLog('error', '数据验证失败', validation.error);
      return res.status(400).json({ 
        success: false, 
        error: validation.error,
        receivedData: data 
      });
    }

    // 转换为CSV格式
    const csvData = convertToCSVFormat(data);
    
    // 读取现有数据
    let existingData = [];
    
    if (fs.existsSync(CONFIG.csvPath)) {
      const csvContent = fs.readFileSync(CONFIG.csvPath, 'utf8');
      existingData = parseCSV(csvContent);
    }
    
    // 检查是否已存在相同的outlet_code
    const existingIndex = existingData.findIndex(row => 
      row.shop_code === csvData.shop_code
    );
    
    if (existingIndex !== -1) {
      // 更新现有记录
      existingData[existingIndex] = csvData;
      writeLog('info', `更新现有记录: ${csvData.shop_code}`, csvData);
    } else {
      // 添加新记录
      existingData.push(csvData);
      writeLog('info', `添加新记录: ${csvData.shop_code}`, csvData);
    }
    
    // 备份原文件
    if (fs.existsSync(CONFIG.csvPath)) {
      const backupPath = path.join(CONFIG.backupDir, 
        `outlets_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`);
      
      fs.copyFileSync(CONFIG.csvPath, backupPath);
      writeLog('info', `数据已备份到: ${backupPath}`);
    }
    
    // 写入更新后的数据
    const csvHeader = 'shop_code,latitude,longitude,outlet_name,brand,kecamatan,potensi\n';
    const csvContent = csvHeader + existingData.map(row => 
      `${row.shop_code},${row.latitude},${row.longitude},"${row.outlet_name}","${row.brand}","${row.kecamatan}","${row.potensi}"`
    ).join('\n');
    
    fs.writeFileSync(CONFIG.csvPath, csvContent, 'utf8');
    
    // 更新统计信息
    stats.totalRequests++;
    stats.successfulUpdates++;
    stats.lastUpdate = new Date().toISOString();
    
    writeLog('info', `数据成功写入CSV文件，总记录数: ${existingData.length}`);
    
    res.json({ 
      success: true, 
      message: '数据接收成功',
      recordCount: existingData.length,
      action: existingIndex !== -1 ? 'updated' : 'added',
      processedData: csvData
    });
    
  } catch (error) {
    stats.errorCount++;
    writeLog('error', '处理飞书数据时出错', error.message);
    res.status(500).json({ 
      success: false, 
      error: '服务器内部错误',
      details: error.message 
    });
  }
});

// 飞书批量数据接收接口
app.post('/api/feishu/batch', authenticateToken, async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!Array.isArray(data)) {
      return res.status(400).json({ 
        success: false, 
        error: '批量数据必须是数组格式' 
      });
    }
    
    writeLog('info', `收到批量数据推送，共${data.length}条记录`);
    
    const results = [];
    const errors = [];
    
    // 验证所有数据
    for (let i = 0; i < data.length; i++) {
      const validation = validateData(data[i]);
      if (!validation.valid) {
        errors.push({ index: i, error: validation.error, data: data[i] });
      } else {
        results.push(convertToCSVFormat(data[i]));
      }
    }
    
    if (errors.length > 0) {
      writeLog('error', '批量数据验证失败', errors);
      return res.status(400).json({ 
        success: false, 
        error: '部分数据验证失败',
        errors: errors,
        validCount: results.length,
        totalCount: data.length
      });
    }
    
    // 读取现有数据
    let existingData = [];
    
    if (fs.existsSync(CONFIG.csvPath)) {
      const csvContent = fs.readFileSync(CONFIG.csvPath, 'utf8');
      existingData = parseCSV(csvContent);
    }
    
    // 备份原文件
    if (fs.existsSync(CONFIG.csvPath)) {
      const backupPath = path.join(CONFIG.backupDir, 
        `outlets_batch_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`);
      
      fs.copyFileSync(CONFIG.csvPath, backupPath);
      writeLog('info', `批量更新前数据已备份到: ${backupPath}`);
    }
    
    let addedCount = 0;
    let updatedCount = 0;
    
    // 处理每条记录
    results.forEach(newData => {
      const existingIndex = existingData.findIndex(row => 
        row.shop_code === newData.shop_code
      );
      
      if (existingIndex !== -1) {
        existingData[existingIndex] = newData;
        updatedCount++;
      } else {
        existingData.push(newData);
        addedCount++;
      }
    });
    
    // 写入更新后的数据
    const csvHeader = 'shop_code,latitude,longitude,outlet_name,brand,kecamatan,potensi\n';
    const csvContent = csvHeader + existingData.map(row => 
      `${row.shop_code},${row.latitude},${row.longitude},"${row.outlet_name}","${row.brand}","${row.kecamatan}","${row.potensi}"`
    ).join('\n');
    
    fs.writeFileSync(CONFIG.csvPath, csvContent, 'utf8');
    
    // 更新统计信息
    stats.totalRequests++;
    stats.successfulUpdates++;
    stats.lastUpdate = new Date().toISOString();
    
    writeLog('info', `批量数据处理完成 - 新增: ${addedCount}, 更新: ${updatedCount}, 总计: ${existingData.length}`);
    
    res.json({ 
      success: true, 
      message: '批量数据处理完成',
      totalRecords: existingData.length,
      addedCount: addedCount,
      updatedCount: updatedCount,
      processedCount: results.length
    });
    
  } catch (error) {
    stats.errorCount++;
    writeLog('error', '处理批量数据时出错', error.message);
    res.status(500).json({ 
      success: false, 
      error: '服务器内部错误',
      details: error.message 
    });
  }
});

// API路由：获取当前数据统计
app.get('/api/status', async (req, res) => {
  try {
    let records = [];
    let recordCount = 0;
    
    if (fs.existsSync(CONFIG.csvPath)) {
      const csvContent = fs.readFileSync(CONFIG.csvPath, 'utf8');
      records = parseCSV(csvContent);
      recordCount = records.length;
    }

    const logFiles = fs.existsSync(CONFIG.logDir) ? 
      fs.readdirSync(CONFIG.logDir).filter(f => f.endsWith('.log')) : [];
    const backupFiles = fs.existsSync(CONFIG.backupDir) ? 
      fs.readdirSync(CONFIG.backupDir).filter(f => f.endsWith('.csv')) : [];

    res.json({
      status: 'running',
      totalRecords: recordCount,
      stats: stats,
      lastUpdate: stats.lastUpdate || '未有更新',
      server: {
        startTime: stats.startTime,
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform
      },
      logs: logFiles.length,
      backups: backupFiles.length
    });

  } catch (error) {
    writeLog('error', '获取状态失败', error.message);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 健康检查路由
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
    uptime: process.uptime()
  });
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    service: '飞书数据接收服务',
    version: '1.0.0',
    status: 'running',
    timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
    endpoints: {
      'POST /api/feishu/webhook': '接收单条数据推送',
      'POST /api/feishu/batch': '接收批量数据推送',
      'GET /api/status': '获取服务状态',
      'GET /health': '健康检查'
    }
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  writeLog('error', '未处理的错误', error.message);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
function startServer() {
  try {
    ensureDirectories();
    
    app.listen(PORT, () => {
      writeLog('info', `飞书数据接收服务已启动`, { port: PORT });
      console.log(`\n====================================`);
      console.log(`🚀 飞书数据接收服务已启动`);
      console.log(`📡 端口: ${PORT}`);
      console.log(`🌐 访问地址: http://localhost:${PORT}`);
      console.log(`📝 Webhook地址: http://localhost:${PORT}/api/feishu/webhook`);
      console.log(`📊 状态查询: http://localhost:${PORT}/api/status`);
      console.log(`====================================\n`);
    });

  } catch (error) {
    writeLog('error', '启动服务器失败', error.message);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', () => {
  writeLog('info', '收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  writeLog('info', '收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});

// 启动服务器
startServer(); 