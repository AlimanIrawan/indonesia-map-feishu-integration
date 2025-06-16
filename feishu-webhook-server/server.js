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
  csvPath: path.join(__dirname, '../public/markers.csv'),
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
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // 跳过空行
    
    // 解析CSV行，处理引号内的逗号
    const values = [];
    let inQuotes = false;
    let currentValue = '';
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim()); // 添加最后一个值
    
    // 检查是否为有效记录（至少有shop_code或经纬度）
    const shop_code = values[0] ? values[0].replace(/"/g, '').trim() : '';
    const latitude = values[1] ? values[1].replace(/"/g, '').trim() : '';
    const longitude = values[2] ? values[2].replace(/"/g, '').trim() : '';
    
    // 跳过完全空的记录
    if (!shop_code && !latitude && !longitude) {
      continue;
    }
    
    const row = {};
    headers.forEach((header, index) => {
      let value = values[index] || '';
      value = value.replace(/^"|"$/g, '').trim(); // 移除引号
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
    shop_code: data.outlet_code || data.shop_code || '',
    latitude: parseFloat(data.latitude) || 0,
    longitude: parseFloat(data.longitude) || 0,
    'outlet name': data.nama_pemilik || data.outlet_name || data['outlet name'] || '',
    brand: data.brand || 'Other',  // 默认品牌
    kecamatan: data.kecamatan || 'Unknown',  // 默认区域
    potensi: data.potensi || ''  // 默认无潜力标记
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
    const csvHeader = 'shop_code,latitude,longitude,outlet name,brand,kecamatan,potensi\n';
    const csvContent = csvHeader + existingData.map(row => 
      `${row.shop_code},${row.latitude},${row.longitude},"${row['outlet name']}","${row.brand}","${row.kecamatan}","${row.potensi}"`
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
    const csvHeader = 'shop_code,latitude,longitude,outlet name,brand,kecamatan,potensi\n';
    const csvContent = csvHeader + existingData.map(row => 
      `${row.shop_code},${row.latitude},${row.longitude},"${row['outlet name']}","${row.brand}","${row.kecamatan}","${row.potensi}"`
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

// 飞书全量替换接口（完全同步模式）
app.post('/api/feishu/replace', authenticateToken, async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!Array.isArray(data)) {
      return res.status(400).json({ 
        success: false, 
        error: '全量替换数据必须是数组格式' 
      });
    }
    
    writeLog('info', `收到全量替换请求，共${data.length}条记录`);
    
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
      writeLog('error', '全量替换数据验证失败', errors);
      return res.status(400).json({ 
        success: false, 
        error: '部分数据验证失败',
        errors: errors,
        validCount: results.length,
        totalCount: data.length
      });
    }
    
    // 备份原文件
    if (fs.existsSync(CONFIG.csvPath)) {
      const backupPath = path.join(CONFIG.backupDir, 
        `outlets_replace_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`);
      
      fs.copyFileSync(CONFIG.csvPath, backupPath);
      writeLog('info', `全量替换前数据已备份到: ${backupPath}`);
    }
    
    // 直接使用新数据替换所有数据
    const csvHeader = 'shop_code,latitude,longitude,outlet name,brand,kecamatan,potensi\n';
    const csvContent = csvHeader + results.map(row => 
      `${row.shop_code},${row.latitude},${row.longitude},"${row['outlet name']}","${row.brand}","${row.kecamatan}","${row.potensi}"`
    ).join('\n');
    
    fs.writeFileSync(CONFIG.csvPath, csvContent, 'utf8');
    
    // 更新统计信息
    stats.totalRequests++;
    stats.successfulUpdates++;
    stats.lastUpdate = new Date().toISOString();
    
    writeLog('info', `全量替换完成 - 新数据条数: ${results.length}，已完全覆盖原有数据`);
    
    res.json({ 
      success: true, 
      message: '全量数据替换完成',
      totalRecords: results.length,
      processedCount: results.length,
      mode: 'complete_replace'
    });
    
  } catch (error) {
    stats.errorCount++;
    writeLog('error', '处理全量替换时出错', error.message);
    res.status(500).json({ 
      success: false, 
      error: '服务器内部错误',
      details: error.message 
    });
  }
});

// API路由：导出CSV数据
app.get('/api/data/csv', async (req, res) => {
  try {
    if (!fs.existsSync(CONFIG.csvPath)) {
      return res.status(404).json({ 
        success: false, 
        error: 'CSV文件不存在' 
      });
    }
    
    const csvContent = fs.readFileSync(CONFIG.csvPath, 'utf8');
    
    // 设置响应头
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="markers.csv"');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    res.send(csvContent);
    
    writeLog('info', 'CSV数据导出请求完成');
    
  } catch (error) {
    writeLog('error', 'CSV数据导出失败', error.message);
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

// 简化的Webhook端点（专为飞书自动化设计）
app.post('/webhook', async (req, res) => {
  try {
    writeLog('info', '收到飞书自动化Webhook数据', JSON.stringify(req.body));
    
    // 从飞书自动化获取的数据格式
    const { record } = req.body;
    if (!record || !record.fields) {
      return res.status(400).json({ 
        success: false, 
        error: '数据格式错误：需要record.fields结构' 
      });
    }
    
    const fields = record.fields;
    
    // 统一字段映射，支持多种字段名
    const outletCode = fields['Outlet Code'] || fields.outlet_code || fields.shop_code || fields['outlet code'] || '';
    const latitude = fields.latitude || fields.lat || fields.Latitude || '';
    const longitude = fields.longitude || fields.lng || fields.Longitude || '';
    const namaPemilik = fields['Nama Pemilik'] || fields.nama_pemilik || fields['outlet name'] || fields.outletName || '';
    
    // 只验证必要的4个字段：Outlet Code, latitude, longitude, Nama Pemilik
    const requiredFields = [
      { name: 'Outlet Code', value: outletCode },
      { name: 'latitude', value: latitude },
      { name: 'longitude', value: longitude },
      { name: 'Nama Pemilik', value: namaPemilik }
    ];
    
    for (const field of requiredFields) {
      if (!field.value || field.value.toString().trim() === '') {
        return res.status(400).json({ 
          success: false, 
          error: `缺少必填字段: ${field.name}`,
          receivedFields: Object.keys(fields)
        });
      }
    }
    
    // 验证经纬度格式
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return res.status(400).json({ 
        success: false, 
        error: '纬度格式错误，必须在-90到90之间' 
      });
    }
    
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return res.status(400).json({ 
        success: false, 
        error: '经度格式错误，必须在-180到180之间' 
      });
    }
    
    // 转换为CSV格式，其他字段都是可选的
    const newData = {
      shop_code: outletCode,
      latitude: lat,
      longitude: lng,
      'outlet name': namaPemilik,
      brand: fields.brand || fields.Brand || 'Other',  // 可选，默认Other
      kecamatan: fields.kecamatan || fields.Kecamatan || '',  // 可选
      potensi: fields.potensi || fields.Potensi || ''  // 可选
    };
    
    // 读取现有数据
    let existingData = [];
    if (fs.existsSync(CONFIG.csvPath)) {
      const csvContent = fs.readFileSync(CONFIG.csvPath, 'utf8');
      existingData = parseCSV(csvContent);
    }
    
    // 查找是否已存在相同的shop_code
    let addedCount = 0;
    let updatedCount = 0;
    
    if (newData.shop_code) {
      const existingIndex = existingData.findIndex(row => 
        row.shop_code === newData.shop_code
      );
      
      if (existingIndex !== -1) {
        existingData[existingIndex] = newData;
        updatedCount = 1;
      } else {
        existingData.push(newData);
        addedCount = 1;
      }
    } else {
      existingData.push(newData);
      addedCount = 1;
    }
    
    // 写入更新后的数据
    const csvHeader = 'shop_code,latitude,longitude,outlet name,brand,kecamatan,potensi\n';
    const csvContent = csvHeader + existingData.map(row => 
      `${row.shop_code},${row.latitude},${row.longitude},"${row['outlet name']}","${row.brand}","${row.kecamatan}","${row.potensi}"`
    ).join('\n');
    
    fs.writeFileSync(CONFIG.csvPath, csvContent, 'utf8');
    
    // 更新统计信息
    stats.totalRequests++;
    stats.successfulUpdates++;
    stats.lastUpdate = new Date().toISOString();
    
    const action = updatedCount > 0 ? 'updated' : 'added';
    writeLog('info', `数据${action === 'updated' ? '更新' : '添加'}成功`, newData);
    
    res.json({ 
      success: true, 
      message: `数据${action === 'updated' ? '更新' : '添加'}成功`,
      action: action,
      data: newData,
      totalRecords: existingData.length
    });
    
  } catch (error) {
    stats.errorCount++;
    writeLog('error', 'Webhook处理失败', error.message);
    res.status(500).json({ 
      success: false, 
      error: '服务器内部错误',
      details: error.message 
    });
  }
});

// 数据清空端点
app.post('/api/data/clear', async (req, res) => {
  try {
    const { confirm } = req.body;
    
    if (!confirm) {
      return res.status(400).json({ 
        success: false, 
        error: '需要确认参数' 
      });
    }
    
    // 备份现有数据
    let clearedCount = 0;
    if (fs.existsSync(CONFIG.csvPath)) {
      const csvContent = fs.readFileSync(CONFIG.csvPath, 'utf8');
      const existingData = parseCSV(csvContent);
      clearedCount = existingData.length;
      
      // 创建备份
      const backupPath = path.join(CONFIG.backupDir, 
        `clear_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`);
      fs.copyFileSync(CONFIG.csvPath, backupPath);
      writeLog('info', `清空前数据已备份到: ${backupPath}`);
    }
    
    // 重置为只有表头的状态
    const emptyCSV = 'shop_code,latitude,longitude,outlet name,brand,kecamatan,potensi\n';
    fs.writeFileSync(CONFIG.csvPath, emptyCSV, 'utf8');
    
    // 重置统计信息
    stats.lastUpdate = new Date().toISOString();
    
    writeLog('info', `数据清空完成，清空了${clearedCount}条记录`);
    
    res.json({ 
      success: true, 
      message: '数据清空完成',
      clearedCount: clearedCount
    });
    
  } catch (error) {
    writeLog('error', '数据清空失败', error.message);
    res.status(500).json({ 
      success: false, 
      error: '服务器内部错误',
      details: error.message 
    });
  }
});

// CSV管理界面
app.get('/admin', (req, res) => {
  const adminHtml = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CSV数据管理 - Render服务器</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            h1 {
                color: #333;
                text-align: center;
                margin-bottom: 30px;
            }
            .button-group {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
                flex-wrap: wrap;
            }
            button {
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: background-color 0.3s;
            }
            .btn-primary {
                background-color: #007bff;
                color: white;
            }
            .btn-primary:hover {
                background-color: #0056b3;
            }
            .btn-success {
                background-color: #28a745;
                color: white;
            }
            .btn-success:hover {
                background-color: #1e7e34;
            }
            .btn-danger {
                background-color: #dc3545;
                color: white;
            }
            .btn-danger:hover {
                background-color: #c82333;
            }
            .btn-warning {
                background-color: #ffc107;
                color: #212529;
            }
            .btn-warning:hover {
                background-color: #e0a800;
            }
            textarea {
                width: 100%;
                min-height: 400px;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 10px;
                margin-bottom: 10px;
                box-sizing: border-box;
            }
            .info-panel {
                background-color: #e9f6ff;
                padding: 15px;
                border-radius: 4px;
                margin-bottom: 20px;
                border-left: 4px solid #007bff;
            }
            .success-message {
                background-color: #d4edda;
                color: #155724;
                padding: 10px;
                border-radius: 4px;
                margin-bottom: 20px;
                border-left: 4px solid #28a745;
            }
            .error-message {
                background-color: #f8d7da;
                color: #721c24;
                padding: 10px;
                border-radius: 4px;
                margin-bottom: 20px;
                border-left: 4px solid #dc3545;
            }
            .loading {
                text-align: center;
                color: #666;
                padding: 20px;
            }
            .stats {
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 4px;
                margin-bottom: 20px;
            }
            .stats h3 {
                margin-top: 0;
                color: #495057;
            }
            .backup-section {
                background-color: #fff3cd;
                padding: 15px;
                border-radius: 4px;
                margin-bottom: 20px;
                border-left: 4px solid #ffc107;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🗺️ CSV数据管理界面</h1>
            
            <div class="info-panel">
                <h3>📋 使用说明</h3>
                <ul>
                    <li><strong>查看数据：</strong> 点击"加载CSV数据"查看当前数据</li>
                    <li><strong>编辑数据：</strong> 在文本框中直接编辑CSV内容</li>
                    <li><strong>保存数据：</strong> 编辑完成后点击"保存CSV数据"</li>
                    <li><strong>备份数据：</strong> 建议在修改前先下载备份</li>
                    <li><strong>清空数据：</strong> 只保留表头，删除所有数据行</li>
                </ul>
            </div>

            <div class="backup-section">
                <h3>⚠️ 安全提醒</h3>
                <p>修改数据前请务必下载备份！数据修改后立即影响地图显示。</p>
            </div>
            
            <div class="button-group">
                <button class="btn-primary" onclick="loadCsvData()">📄 加载CSV数据</button>
                <button class="btn-success" onclick="saveCsvData()">💾 保存CSV数据</button>
                <button class="btn-warning" onclick="downloadBackup()">⬇️ 下载备份</button>
                <button class="btn-danger" onclick="clearCsvData()">🗑️ 清空数据</button>
                <button class="btn-primary" onclick="testWebhook()">🔧 测试Webhook</button>
            </div>
            
            <div id="message"></div>
            <div id="stats"></div>
            
            <textarea id="csvContent" placeholder="CSV数据将在这里显示..."></textarea>
            
            <div class="button-group">
                <button class="btn-success" onclick="saveCsvData()">💾 保存更改</button>
                <button class="btn-primary" onclick="addSampleData()">➕ 添加示例数据</button>
            </div>
        </div>

        <script>
            function showMessage(message, type = 'success') {
                const messageDiv = document.getElementById('message');
                messageDiv.className = type + '-message';
                messageDiv.textContent = message;
                setTimeout(() => {
                    messageDiv.textContent = '';
                    messageDiv.className = '';
                }, 5000);
            }

            function updateStats(csvText) {
                const lines = csvText.split('\\n').filter(line => line.trim());
                const dataRows = lines.length > 1 ? lines.length - 1 : 0;
                
                document.getElementById('stats').innerHTML = \`
                    <div class="stats">
                        <h3>📊 数据统计</h3>
                        <p><strong>总行数：</strong> \${lines.length}</p>
                        <p><strong>数据行数：</strong> \${dataRows}</p>
                        <p><strong>最后更新：</strong> \${new Date().toLocaleString('zh-CN')}</p>
                    </div>
                \`;
            }

            async function loadCsvData() {
                try {
                    showMessage('正在加载CSV数据...', 'loading');
                    const response = await fetch('/api/data/csv');
                    if (!response.ok) {
                        throw new Error(\`HTTP错误: \${response.status}\`);
                    }
                    const csvText = await response.text();
                    document.getElementById('csvContent').value = csvText;
                    updateStats(csvText);
                    showMessage('CSV数据加载成功！');
                } catch (error) {
                    showMessage('加载CSV数据失败: ' + error.message, 'error');
                }
            }

            async function saveCsvData() {
                const csvContent = document.getElementById('csvContent').value;
                if (!csvContent.trim()) {
                    showMessage('CSV内容不能为空！', 'error');
                    return;
                }
                
                try {
                    showMessage('正在保存CSV数据...', 'loading');
                    const response = await fetch('/api/data/save', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ csvData: csvContent })
                    });
                    
                    if (!response.ok) {
                        throw new Error(\`HTTP错误: \${response.status}\`);
                    }
                    
                    const result = await response.json();
                    updateStats(csvContent);
                    showMessage('CSV数据保存成功！');
                } catch (error) {
                    showMessage('保存CSV数据失败: ' + error.message, 'error');
                }
            }

            async function clearCsvData() {
                if (!confirm('确定要清空所有数据吗？此操作只保留表头。')) {
                    return;
                }
                
                try {
                    const response = await fetch('/api/data/clear', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ confirm: true })
                    });
                    
                    if (!response.ok) {
                        throw new Error(\`HTTP错误: \${response.status}\`);
                    }
                    
                    await loadCsvData(); // 重新加载数据
                    showMessage('CSV数据已清空！');
                } catch (error) {
                    showMessage('清空数据失败: ' + error.message, 'error');
                }
            }

            function downloadBackup() {
                const csvContent = document.getElementById('csvContent').value;
                if (!csvContent.trim()) {
                    showMessage('没有数据可以下载！', 'error');
                    return;
                }
                
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', \`backup-\${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv\`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showMessage('备份文件已下载！');
            }

            async function testWebhook() {
                try {
                    showMessage('正在测试Webhook...', 'loading');
                    const response = await fetch('/webhook', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            record: {
                                fields: {
                                    shop_code: '999999999999',
                                    latitude: '-6.112533',
                                    longitude: '106.917317',
                                    'outlet name': '测试店铺',
                                    brand: '测试品牌',
                                    kecamatan: '测试区域',
                                    potensi: 'potensi'
                                }
                            }
                        })
                    });
                    
                    if (!response.ok) {
                        throw new Error(\`HTTP错误: \${response.status}\`);
                    }
                    
                    const result = await response.json();
                    showMessage('Webhook测试成功！已添加测试数据。');
                    // 重新加载数据显示
                    await loadCsvData();
                } catch (error) {
                    showMessage('Webhook测试失败: ' + error.message, 'error');
                }
            }

            function addSampleData() {
                const currentContent = document.getElementById('csvContent').value;
                const sampleData = \`\\n888888888888,-6.112533,106.917317,示例店铺,示例品牌,示例区域,\`;
                document.getElementById('csvContent').value = currentContent + sampleData;
                showMessage('已添加示例数据行！请点击保存按钮保存更改。');
            }

            // 页面加载时自动加载CSV数据
            window.onload = function() {
                loadCsvData();
            };
        </script>
    </body>
    </html>
  `;
  
  res.send(adminHtml);
});

// 保存CSV数据端点
app.post('/api/data/save', async (req, res) => {
  try {
    const { csvData } = req.body;
    
    if (!csvData) {
      return res.status(400).json({ 
        success: false, 
        message: 'CSV数据不能为空' 
      });
    }

    // 创建备份
    if (fs.existsSync(CONFIG.csvPath)) {
      const backupPath = path.join(CONFIG.backupDir, 
        `manual_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`);
      fs.copyFileSync(CONFIG.csvPath, backupPath);
      writeLog('info', `保存前数据已备份到: ${backupPath}`);
    }

    // 保存CSV数据到文件
    fs.writeFileSync(CONFIG.csvPath, csvData, 'utf8');
    
    // 更新统计信息
    stats.lastUpdate = new Date().toISOString();
    
    writeLog('info', 'CSV数据已通过管理界面更新');
    
    res.json({ 
      success: true, 
      message: 'CSV数据保存成功',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    writeLog('error', '保存CSV数据出错', error.message);
    res.status(500).json({ 
      success: false, 
      message: '保存失败: ' + error.message 
    });
  }
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