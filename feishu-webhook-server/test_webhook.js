#!/usr/bin/env node

const fetch = require('node-fetch');

// 测试配置
const TEST_CONFIG = {
  serverUrl: 'http://localhost:3001',
  apiToken: 'your-super-secret-token'
};

// 测试数据
const testData = {
  shop_code: '123456789012',
  latitude: -6.1234567,
  longitude: 106.1234567,
  outlet_name: '测试店铺',
  brand: 'Aice',
  kecamatan: 'Cakung',
  potensi: 'potensi'
};

// 发送测试请求
async function testWebhook() {
  try {
    console.log('🧪 开始测试飞书数据接收服务...\n');

    // 1. 健康检查
    console.log('1. 检查服务状态...');
    const healthResponse = await fetch(`${TEST_CONFIG.serverUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ 服务状态:', healthData);

    // 2. 获取当前状态
    console.log('\n2. 获取当前数据状态...');
    const statusResponse = await fetch(`${TEST_CONFIG.serverUrl}/api/status`);
    const statusData = await statusResponse.json();
    console.log('📊 当前状态:', statusData);

    // 3. 发送测试数据
    console.log('\n3. 发送测试数据...');
    const webhookResponse = await fetch(`${TEST_CONFIG.serverUrl}/api/feishu/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_CONFIG.apiToken}`
      },
      body: JSON.stringify({
        data: testData
      })
    });

    const webhookResult = await webhookResponse.json();
    
    if (webhookResponse.ok) {
      console.log('✅ 数据推送成功:', webhookResult);
    } else {
      console.log('❌ 数据推送失败:', webhookResult);
    }

    // 4. 再次获取状态验证
    console.log('\n4. 验证数据是否已更新...');
    const finalStatusResponse = await fetch(`${TEST_CONFIG.serverUrl}/api/status`);
    const finalStatusData = await finalStatusResponse.json();
    console.log('📊 更新后状态:', finalStatusData);

    // 5. 测试批量数据
    console.log('\n5. 测试批量数据推送...');
    const batchData = [
      {
        shop_code: '123456789013',
        latitude: -6.2345678,
        longitude: 106.2345678,
        outlet_name: '批量测试店铺1',
        brand: 'halocoko',
        kecamatan: 'Jakarta Timur'
      },
      {
        shop_code: '123456789014',
        latitude: -6.3456789,
        longitude: 106.3456789,
        outlet_name: '批量测试店铺2',
        brand: 'Walls',
        kecamatan: 'Jakarta Selatan'
      }
    ];

    const batchResponse = await fetch(`${TEST_CONFIG.serverUrl}/api/feishu/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_CONFIG.apiToken}`
      },
      body: JSON.stringify({
        data: batchData
      })
    });

    const batchResult = await batchResponse.json();
    
    if (batchResponse.ok) {
      console.log('✅ 批量数据推送成功:', batchResult);
    } else {
      console.log('❌ 批量数据推送失败:', batchResult);
    }

    console.log('\n🎉 测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('请确保飞书数据接收服务正在运行（端口3001）');
  }
}

// 运行测试
if (require.main === module) {
  testWebhook();
}

module.exports = { testWebhook }; 