/**
 * 飞书自动化脚本模板
 * 用于将多维表格数据自动推送到地图标注系统
 * 
 * 使用方法：
 * 1. 复制此模板到飞书自动化的"自定义脚本"中
 * 2. 修改SERVER_URL和API_TOKEN为实际值
 * 3. 根据表格字段名调整字段映射
 */

// 导入依赖模块
const axios = require('axios');

// ===== 配置区域 =====
const CONFIG = {
  // 服务器地址（请修改为实际地址）
  SERVER_URL: 'http://您的服务器地址:3001',
  
  // API密钥（请修改为实际密钥）
  API_TOKEN: 'feishu-indonesia-map-2024-1750066642-961a3a40e8d0f13d',
  
  // 字段映射（如果表格字段名不同，请修改）
  FIELD_MAPPING: {
    outlet_code: 'Outlet Code',
    latitude: 'latitude', 
    longitude: 'longitude',
    nama_pemilik: 'Nama Pemilik'
  },

  // 飞书应用配置
  feishu: {
    appId: 'cli_a8c55c2b3268900e',
    appSecret: 'kEOPt0k9hIMrVg82xqafgdbQZPYlCr8l',
    baseUrl: 'https://open.feishu.cn'
  },
  
  // 多维表格配置
  bitable: {
    appToken: 'HEqVwhzBciH75KkD0ZclpFQugnJ',
    tableId: 'tblr5cr35dwKZaj1'
    // 注释掉 viewId，让系统使用默认视图
    // viewId: 'vewOt0hp6k'
  },
  
  // Render服务器配置
  webhook: {
    url: 'https://indonesia-map-feishu-integration.onrender.com',
    token: 'feishu-indonesia-map-2024-1750066642-961a3a40e8d0f13d'
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

// 获取飞书访问令牌
async function getAccessToken() {
  try {
    const response = await axios.post(`${CONFIG.feishu.baseUrl}/open-apis/auth/v3/tenant_access_token/internal`, {
      app_id: CONFIG.feishu.appId,
      app_secret: CONFIG.feishu.appSecret
    });

    if (response.data.code === 0) {
      return response.data.tenant_access_token;
    } else {
      throw new Error(`获取访问令牌失败: ${response.data.msg}`);
    }
  } catch (error) {
    console.error('获取访问令牌失败:', error.message);
    throw error;
  }
}

// 获取多维表格所有记录（分页获取）
async function getAllTableRecords(accessToken) {
  try {
    let allRecords = [];
    let pageToken = undefined;
    let hasMore = true;

    console.log('📊 开始获取飞书表格数据...');

    while (hasMore) {
      const params = {
        page_size: 500 // 每页最多500条
      };
      
      if (pageToken) {
        params.page_token = pageToken;
      }
      
      // 暂时注释掉 viewId 参数，使用默认视图
      // if (CONFIG.bitable.viewId) {
      //   params.view_id = CONFIG.bitable.viewId;
      // }

      console.log(`📡 API请求参数:`, {
        url: `${CONFIG.feishu.baseUrl}/open-apis/bitable/v1/apps/${CONFIG.bitable.appToken}/tables/${CONFIG.bitable.tableId}/records`,
        params: params
      });

      const response = await axios.get(
        `${CONFIG.feishu.baseUrl}/open-apis/bitable/v1/apps/${CONFIG.bitable.appToken}/tables/${CONFIG.bitable.tableId}/records`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          params
        }
      );

      if (response.data.code === 0) {
        const records = response.data.data.items || [];
        allRecords = allRecords.concat(records);
        
        console.log(`📥 已获取 ${records.length} 条记录，累计 ${allRecords.length} 条`);
        
        hasMore = response.data.data.has_more;
        pageToken = response.data.data.page_token;
      } else {
        console.error('❌ 飞书API返回错误:', response.data);
        throw new Error(`获取表格记录失败: ${response.data.msg || response.data.code}`);
      }
    }

    console.log(`✅ 成功获取飞书表格数据，总计 ${allRecords.length} 条记录`);
    return allRecords;

  } catch (error) {
    console.error('获取表格记录失败:', error.message);
    if (error.response) {
      console.error('API响应错误:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    throw error;
  }
}

// 转换飞书记录为标准格式
function convertFeishuRecord(record) {
  const fields = record.fields;
  
  // 根据您的飞书表格字段名称调整
  return {
    outlet_code: fields['outlet_code'] || fields['店铺代码'] || '',
    latitude: fields['latitude'] || fields['纬度'] || '',
    longitude: fields['longitude'] || fields['经度'] || '', 
    nama_pemilik: fields['nama_pemilik'] || fields['店主姓名'] || fields['outlet_name'] || '',
    brand: fields['brand'] || fields['品牌'] || 'Other',
    kecamatan: fields['kecamatan'] || fields['区域'] || 'Unknown',
    potensi: fields['potensi'] || fields['潜力'] || ''
  };
}

// 增量同步单条记录
async function syncSingleRecord(recordData) {
  try {
    console.log('📤 发送单条记录到Render服务器...');
    
    const response = await axios.post(`${CONFIG.webhook.url}/api/feishu/webhook`, {
      data: recordData,
      token: CONFIG.webhook.token
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': CONFIG.webhook.token
      }
    });

    if (response.data.success) {
      console.log(`✅ 单条记录同步成功: ${recordData.outlet_code}`);
      return response.data;
    } else {
      throw new Error(response.data.error || '同步失败');
    }

  } catch (error) {
    console.error('单条记录同步失败:', error.message);
    throw error;
  }
}

// 批量增量同步
async function syncBatchRecords(recordsData) {
  try {
    console.log(`📤 发送批量记录到Render服务器（${recordsData.length}条）...`);
    
    const response = await axios.post(`${CONFIG.webhook.url}/api/feishu/batch`, {
      data: recordsData,
      token: CONFIG.webhook.token
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': CONFIG.webhook.token
      }
    });

    if (response.data.success) {
      console.log(`✅ 批量同步成功: 新增${response.data.addedCount}条，更新${response.data.updatedCount}条`);
      return response.data;
    } else {
      throw new Error(response.data.error || '批量同步失败');
    }

  } catch (error) {
    console.error('批量同步失败:', error.message);
    throw error;
  }
}

// 🔄 全量替换同步（新功能）
async function syncReplaceAll(recordsData) {
  try {
    console.log(`🔄 执行全量替换同步到Render服务器（${recordsData.length}条）...`);
    console.log('⚠️  注意：这将完全替换服务器上的所有数据！');
    
    const response = await axios.post(`${CONFIG.webhook.url}/api/feishu/replace`, {
      data: recordsData,
      token: CONFIG.webhook.token
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': CONFIG.webhook.token
      }
    });

    if (response.data.success) {
      console.log(`✅ 全量替换成功: 总记录数${response.data.totalRecords}条`);
      console.log(`🔄 同步模式: ${response.data.mode}`);
      return response.data;
    } else {
      throw new Error(response.data.error || '全量替换失败');
    }

  } catch (error) {
    console.error('全量替换失败:', error.message);
    throw error;
  }
}

// 主执行函数
async function main() {
  try {
    console.log('\n🚀 飞书数据自动化同步开始...');
    
    // 获取同步模式参数
    const syncMode = process.argv[2] || 'batch'; // 默认批量增量
    console.log(`📋 同步模式: ${syncMode}`);
    
    // 1. 获取访问令牌
    const accessToken = await getAccessToken();
    
    // 2. 获取所有表格记录
    const records = await getAllTableRecords(accessToken);
    
    if (records.length === 0) {
      console.log('📭 没有找到任何记录');
      return;
    }
    
    // 3. 转换记录格式
    const convertedRecords = records.map(convertFeishuRecord).filter(record => 
      record.outlet_code && record.latitude && record.longitude
    );
    
    console.log(`🔄 有效记录数: ${convertedRecords.length}`);
    
    // 4. 根据模式执行同步
    let result;
    
    switch (syncMode) {
      case 'single':
        // 单条同步（仅同步第一条记录作为示例）
        if (convertedRecords.length > 0) {
          result = await syncSingleRecord(convertedRecords[0]);
        }
        break;
        
      case 'batch':
        // 批量增量同步
        result = await syncBatchRecords(convertedRecords);
        break;
        
      case 'replace':
        // 🔄 全量替换同步
        result = await syncReplaceAll(convertedRecords);
        break;
        
      default:
        throw new Error(`未知的同步模式: ${syncMode}`);
    }
    
    console.log('\n✅ 飞书数据自动化同步完成！');
    console.log('📊 同步结果:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('\n❌ 飞书数据自动化同步失败!');
    console.error('错误详情:', error.message);
    
    console.log('\n🔍 请检查:');
    console.log('1. 飞书应用配置是否正确');
    console.log('2. 多维表格ID和视图ID是否正确');
    console.log('3. Render服务器是否在线');
    console.log('4. 网络连接是否正常');
  }
}

// 使用说明
function showUsage() {
  console.log('\n📋 使用方法:');
  console.log('node 飞书自动化模板.js [模式]');
  console.log('');
  console.log('模式选项:');
  console.log('  single   - 单条记录同步（测试用）');
  console.log('  batch    - 批量增量同步（默认）');
  console.log('  replace  - 全量替换同步（强制同步）');
  console.log('');
  console.log('示例:');
  console.log('  node 飞书自动化模板.js replace   # 全量替换同步');
  console.log('  node 飞书自动化模板.js batch     # 增量同步');
}

// 如果直接运行此脚本
if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showUsage();
  } else {
    main();
  }
}

module.exports = {
  getAccessToken,
  getAllTableRecords,
  convertFeishuRecord,
  syncSingleRecord,
  syncBatchRecords,
  syncReplaceAll
}; 