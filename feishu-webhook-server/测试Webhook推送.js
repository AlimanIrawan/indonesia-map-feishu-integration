/**
 * 测试飞书Webhook推送功能
 * 验证简化的Webhook端点是否正常工作
 */

const axios = require('axios');

console.log('🧪 飞书Webhook推送测试');
console.log('========================================\n');

const RENDER_URL = 'https://indonesia-map-feishu-integration.onrender.com';
const LOCAL_URL = 'http://localhost:3001';

// 测试数据（模拟飞书自动化发送的格式）
const testData = {
  record: {
    fields: {
      shop_code: '999999999999',
      latitude: '-6.2000000',
      longitude: '106.8166666',
      'outlet name': '测试门店',
      brand: '测试品牌',
      kecamatan: '测试区域',
      potensi: 'potensi'
    }
  }
};

async function testWebhook(baseUrl, name) {
  console.log(`🔍 测试 ${name}...`);
  console.log(`URL: ${baseUrl}/webhook`);
  
  try {
    // 1. 先检查服务器状态
    console.log('📡 检查服务器状态...');
    const healthResponse = await axios.get(`${baseUrl}/health`, {
      timeout: 10000
    });
    
    if (healthResponse.status === 200) {
      console.log('✅ 服务器在线');
    }
    
    // 2. 发送测试数据
    console.log('📤 发送测试数据...');
    console.log('测试数据:', JSON.stringify(testData, null, 2));
    
    const webhookResponse = await axios.post(`${baseUrl}/webhook`, testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    if (webhookResponse.status === 200) {
      console.log('✅ Webhook推送成功！');
      console.log('响应:', JSON.stringify(webhookResponse.data, null, 2));
    }
    
    // 3. 验证数据是否保存
    console.log('🔍 验证数据保存...');
    
    const statusResponse = await axios.get(`${baseUrl}/api/status`);
    console.log('📊 当前数据统计:');
    console.log(`- 总记录数: ${statusResponse.data.totalRecords || 0}`);
    console.log(`- 最后更新: ${statusResponse.data.lastUpdate || '未知'}`);
    
    // 4. 获取CSV数据验证
    try {
      const csvResponse = await axios.get(`${baseUrl}/api/data/csv`);
      const csvLines = csvResponse.data.split('\n');
      console.log(`📄 CSV文件行数: ${csvLines.length - 1} (除表头)`);
      
      // 检查是否包含测试数据
      const hasTestData = csvResponse.data.includes('999999999999');
      if (hasTestData) {
        console.log('✅ 测试数据已成功保存到CSV');
      } else {
        console.log('⚠️ CSV中未找到测试数据');
      }
      
    } catch (csvError) {
      console.log('⚠️ 无法获取CSV数据:', csvError.message);
    }
    
    console.log(`\n🎉 ${name} 测试完成！\n`);
    return true;
    
  } catch (error) {
    console.log(`❌ ${name} 测试失败:`, error.response?.data?.error || error.message);
    console.log(`状态码: ${error.response?.status || '未知'}\n`);
    return false;
  }
}

async function testDataClear(baseUrl, name) {
  console.log(`🗑️ 测试 ${name} 数据清空功能...`);
  
  try {
    const clearResponse = await axios.post(`${baseUrl}/api/data/clear`, {
      confirm: true
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    if (clearResponse.status === 200) {
      console.log('✅ 数据清空成功！');
      console.log('响应:', JSON.stringify(clearResponse.data, null, 2));
      return true;
    }
    
  } catch (error) {
    console.log(`❌ 数据清空失败:`, error.response?.data?.error || error.message);
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('🎯 开始测试飞书Webhook功能...\n');
  
  // 测试本地服务器（如果运行的话）
  console.log('=' .repeat(50));
  console.log('测试 1: 本地服务器');
  console.log('=' .repeat(50));
  const localSuccess = await testWebhook(LOCAL_URL, '本地服务器');
  
  // 测试Render服务器
  console.log('=' .repeat(50));
  console.log('测试 2: Render服务器');
  console.log('=' .repeat(50));
  const renderSuccess = await testWebhook(RENDER_URL, 'Render服务器');
  
  // 如果Render测试成功，清空测试数据
  if (renderSuccess) {
    console.log('=' .repeat(50));
    console.log('清理: 清空Render测试数据');
    console.log('=' .repeat(50));
    await testDataClear(RENDER_URL, 'Render服务器');
  }
  
  // 总结
  console.log('=' .repeat(50));
  console.log('📋 测试总结');
  console.log('=' .repeat(50));
  console.log(`本地服务器: ${localSuccess ? '✅ 成功' : '❌ 失败'}`);
  console.log(`Render服务器: ${renderSuccess ? '✅ 成功' : '❌ 失败'}`);
  
  if (renderSuccess) {
    console.log('\n🎉 Render服务器Webhook功能正常！');
    console.log('可以在飞书自动化中使用以下配置：');
    console.log(`URL: ${RENDER_URL}/webhook`);
    console.log('方法: POST');
    console.log('请求体格式: 如上面测试数据所示');
  } else {
    console.log('\n⚠️ Render服务器可能需要时间启动，请稍后重试');
  }
}

// 运行测试
runTests().catch(error => {
  console.error('❌ 测试执行失败:', error.message);
}); 