#!/usr/bin/env node

const axios = require('axios');

// 测试配置
const WEBHOOK_URL = 'https://indonesia-map-feishu-integration.onrender.com/webhook';

// 模拟飞书发送的实际数据格式（基于您的截图）
const testData = {
  record: {
    fields: {
      // 使用您飞书表格中的确切字段名
      "Outlet Code": "250429104405",
      "latitude": "-6.111696",
      "longitude": "106.914977", 
      "Nama Pemilik": "Ibu Tati"
    }
  }
};

console.log('🧪 测试实际飞书数据格式');
console.log('======================================');
console.log('发送的数据:', JSON.stringify(testData, null, 2));
console.log('');

async function testRealFeishuData() {
  try {
    console.log('🔍 检查服务器状态...');
    const healthResponse = await axios.get('https://indonesia-map-feishu-integration.onrender.com/health');
    console.log('✅ 服务器正常:', healthResponse.data.status);
    console.log('');
    
    console.log('📡 发送测试数据到Webhook...');
    const response = await axios.post(WEBHOOK_URL, testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    console.log('✅ 测试成功！');
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    // 验证CSV数据
    console.log('\n🔍 验证CSV数据...');
    const csvResponse = await axios.get('https://indonesia-map-feishu-integration.onrender.com/api/data/csv');
    console.log('✅ CSV数据获取成功');
    console.log('CSV内容:');
    console.log(csvResponse.data);
    
  } catch (error) {
    console.log('❌ 测试失败');
    if (error.response) {
      console.log('状态码:', error.response.status);
      console.log('错误详情:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('错误:', error.message);
    }
  }
}

testRealFeishuData(); 