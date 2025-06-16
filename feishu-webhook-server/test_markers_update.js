#!/usr/bin/env node

/**
 * 测试Markers.csv文件更新功能
 * 验证飞书数据是否能正确写入地图系统的CSV文件
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 配置
const API_URL = 'http://localhost:3001';
const API_TOKEN = 'your-super-secret-token';
const CSV_PATH = path.join(__dirname, '../public/markers.csv');

// 测试数据
const testData = {
  outlet_code: 'TEST' + Date.now(),
  latitude: -6.1234567,
  longitude: 106.1234567,
  nama_pemilik: '测试店铺' + new Date().getHours() + new Date().getMinutes(),
  brand: 'halocoko',
  kecamatan: 'Cakung',
  potensi: 'potensi'
};

async function runTest() {
  console.log('🚀 开始测试Markers.csv文件更新功能...\n');
  
  try {
    // 1. 检查CSV文件当前状态
    console.log('📄 检查CSV文件当前状态...');
    let beforeCount = 0;
    if (fs.existsSync(CSV_PATH)) {
      const beforeContent = fs.readFileSync(CSV_PATH, 'utf8');
      beforeCount = beforeContent.split('\n').length - 1; // 减去标题行
      console.log(`   当前文件行数: ${beforeCount}`);
    } else {
      console.log('   CSV文件不存在');
    }
    
    // 2. 发送测试数据
    console.log('\n📤 发送测试数据到webhook...');
    console.log('   测试数据:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post(`${API_URL}/api/feishu/webhook`, 
      { data: testData },
      { 
        headers: { 
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('   ✅ 请求成功:', response.status);
    console.log('   响应:', JSON.stringify(response.data, null, 2));
    
    // 3. 检查CSV文件更新后状态
    console.log('\n📄 检查CSV文件更新后状态...');
    if (fs.existsSync(CSV_PATH)) {
      const afterContent = fs.readFileSync(CSV_PATH, 'utf8');
      const afterCount = afterContent.split('\n').length - 1;
      console.log(`   更新后行数: ${afterCount}`);
      console.log(`   新增数据: ${afterCount - beforeCount} 条`);
      
      // 显示最后几行数据
      const lines = afterContent.trim().split('\n');
      console.log('\n   最后3行数据:');
      lines.slice(-3).forEach((line, index) => {
        console.log(`   ${lines.length - 3 + index + 1}: ${line}`);
      });
      
      // 检查测试数据是否存在
      const hasTestData = afterContent.includes(testData.outlet_code);
      console.log(`\n   测试数据存在: ${hasTestData ? '✅ 是' : '❌ 否'}`);
      
    } else {
      console.log('   ❌ CSV文件仍然不存在');
    }
    
    // 4. 测试地图应用是否能读取数据
    console.log('\n🗺️  测试地图应用数据读取...');
    try {
      const mapResponse = await axios.get(`${API_URL.replace(':3001', ':3000')}/markers.csv`);
      console.log('   ✅ 地图应用可以读取CSV文件');
      console.log(`   文件大小: ${mapResponse.data.length} 字符`);
    } catch (error) {
      console.log('   ⚠️  地图应用读取测试跳过（需要地图服务运行）');
    }
    
    console.log('\n✅ 测试完成！');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    if (error.response) {
      console.error('   错误详情:', error.response.data);
    }
  }
}

// 运行测试
if (require.main === module) {
  runTest();
}

module.exports = { runTest, testData }; 