/**
 * 飞书自动化脚本模板
 * 用于将多维表格数据自动推送到地图标注系统
 * 
 * 使用方法：
 * 1. 复制此模板到飞书自动化的"自定义脚本"中
 * 2. 修改SERVER_URL和API_TOKEN为实际值
 * 3. 根据表格字段名调整字段映射
 */

// ===== 配置区域 =====
const CONFIG = {
  // 服务器地址（请修改为实际地址）
  SERVER_URL: 'http://您的服务器地址:3001',
  
  // API密钥（请修改为实际密钥）
  API_TOKEN: 'your-super-secret-token',
  
  // 字段映射（如果表格字段名不同，请修改）
  FIELD_MAPPING: {
    outlet_code: 'Outlet Code',
    latitude: 'latitude', 
    longitude: 'longitude',
    nama_pemilik: 'Nama Pemilik'
  }
};

// ===== 主要函数 =====

/**
 * 发送数据到地图系统
 * @param {Object} recordData - 记录数据
 */
async function sendToMapSystem(recordData) {
  try {
    // 构建请求数据
    const payload = {
      data: {
        outlet_code: recordData[CONFIG.FIELD_MAPPING.outlet_code] || '',
        latitude: parseFloat(recordData[CONFIG.FIELD_MAPPING.latitude]) || 0,
        longitude: parseFloat(recordData[CONFIG.FIELD_MAPPING.longitude]) || 0,
        nama_pemilik: recordData[CONFIG.FIELD_MAPPING.nama_pemilik] || ''
      }
    };

    // 数据验证
    if (!validateData(payload.data)) {
      throw new Error('数据验证失败');
    }

    // 发送HTTP请求
    const response = await fetch(`${CONFIG.SERVER_URL}/api/feishu/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': CONFIG.API_TOKEN
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP请求失败: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('推送成功:', result);
    return result;

  } catch (error) {
    console.error('推送失败:', error.message);
    
    // 发送错误通知（可选）
    await sendErrorNotification(error, recordData);
    
    throw error;
  }
}

/**
 * 数据验证函数
 * @param {Object} data - 待验证的数据
 * @returns {boolean} - 验证结果
 */
function validateData(data) {
  // 检查必填字段
  const requiredFields = ['outlet_code', 'latitude', 'longitude', 'nama_pemilik'];
  
  for (const field of requiredFields) {
    if (!data[field] || data[field].toString().trim() === '') {
      console.error(`缺少必填字段: ${field}`);
      return false;
    }
  }

  // 验证经纬度格式
  const lat = parseFloat(data.latitude);
  const lng = parseFloat(data.longitude);
  
  if (isNaN(lat) || lat < -90 || lat > 90) {
    console.error('纬度格式错误');
    return false;
  }
  
  if (isNaN(lng) || lng < -180 || lng > 180) {
    console.error('经度格式错误');
    return false;
  }

  return true;
}

/**
 * 发送错误通知
 * @param {Error} error - 错误对象
 * @param {Object} recordData - 记录数据
 */
async function sendErrorNotification(error, recordData) {
  try {
    // 这里可以配置错误通知方式，比如发送飞书消息
    const notification = {
      title: '地图数据推送失败',
      message: `错误信息: ${error.message}`,
      data: recordData,
      timestamp: new Date().toISOString()
    };
    
    console.error('错误通知:', notification);
    
    // 可以在这里添加发送通知的代码
    // 比如发送到飞书群或邮件
    
  } catch (notificationError) {
    console.error('发送错误通知失败:', notificationError);
  }
}

/**
 * 重试机制
 * @param {Function} fn - 要重试的函数
 * @param {number} maxRetries - 最大重试次数
 * @param {number} delay - 重试延迟（毫秒）
 */
async function retry(fn, maxRetries = 3, delay = 1000) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries) {
        throw error;
      }
      
      console.log(`第${i + 1}次尝试失败，${delay}ms后重试...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // 指数退避
    }
  }
}

// ===== 飞书自动化入口函数 =====

/**
 * 记录创建时触发
 * @param {Object} record - 新创建的记录
 */
async function onRecordCreated(record) {
  console.log('新记录创建:', record);
  
  try {
    await retry(() => sendToMapSystem(record));
    console.log('数据推送成功');
  } catch (error) {
    console.error('数据推送最终失败:', error.message);
  }
}

/**
 * 记录更新时触发
 * @param {Object} oldRecord - 旧记录
 * @param {Object} newRecord - 新记录
 */
async function onRecordUpdated(oldRecord, newRecord) {
  console.log('记录更新:', { oldRecord, newRecord });
  
  try {
    await retry(() => sendToMapSystem(newRecord));
    console.log('数据推送成功');
  } catch (error) {
    console.error('数据推送最终失败:', error.message);
  }
}

// ===== 批量处理函数 =====

/**
 * 批量推送数据
 * @param {Array} records - 记录数组
 */
async function batchSendToMapSystem(records) {
  try {
    const payload = {
      data: records.map(record => ({
        outlet_code: record[CONFIG.FIELD_MAPPING.outlet_code] || '',
        latitude: parseFloat(record[CONFIG.FIELD_MAPPING.latitude]) || 0,
        longitude: parseFloat(record[CONFIG.FIELD_MAPPING.longitude]) || 0,
        nama_pemilik: record[CONFIG.FIELD_MAPPING.nama_pemilik] || ''
      }))
    };

    const response = await fetch(`${CONFIG.SERVER_URL}/api/feishu/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': CONFIG.API_TOKEN
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`批量推送失败: ${response.status}`);
    }

    const result = await response.json();
    console.log('批量推送结果:', result);
    return result;

  } catch (error) {
    console.error('批量推送失败:', error.message);
    throw error;
  }
}

// ===== 工具函数 =====

/**
 * 测试连接
 */
async function testConnection() {
  try {
    const response = await fetch(`${CONFIG.SERVER_URL}/health`);
    if (response.ok) {
      console.log('服务器连接正常');
      return true;
    } else {
      console.error('服务器连接失败');
      return false;
    }
  } catch (error) {
    console.error('连接测试失败:', error.message);
    return false;
  }
}

/**
 * 获取服务器状态
 */
async function getServerStatus() {
  try {
    const response = await fetch(`${CONFIG.SERVER_URL}/api/status`);
    if (response.ok) {
      const status = await response.json();
      console.log('服务器状态:', status);
      return status;
    }
  } catch (error) {
    console.error('获取服务器状态失败:', error.message);
  }
}

// ===== 使用示例 =====

/*
// 在飞书自动化中使用：

// 1. 当记录创建时
trigger('record_created', async (record) => {
  await onRecordCreated(record.fields);
});

// 2. 当记录更新时  
trigger('record_updated', async (oldRecord, newRecord) => {
  await onRecordUpdated(oldRecord.fields, newRecord.fields);
});

// 3. 手动测试连接
async function manualTest() {
  const isConnected = await testConnection();
  if (isConnected) {
    await getServerStatus();
  }
}
*/ 