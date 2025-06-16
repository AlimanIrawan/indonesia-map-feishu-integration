#!/usr/bin/env node

/**
 * 飞书集成测试工具
 * 用于验证飞书数据推送到地图系统是否正常工作
 */

const readline = require('readline');
const fetch = require('node-fetch');

// === 配置区域 ===
const CONFIG = {
  // 修改为您的Render服务地址
  SERVER_URL: 'https://indonesia-map-feishu-service.onrender.com', // 默认Render地址
  API_TOKEN: 'your-super-secret-token-12345',
  
  // 如果需要测试本地服务器，取消下面这行的注释
  // SERVER_URL: 'http://localhost:3001',
  
  ENDPOINTS: {
    root: '',
    health: '/health',
    status: '/api/status',
    webhook: '/api/feishu/webhook',
    batch: '/api/feishu/batch'
  }
};

// === 颜色输出 ===
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// === HTTP请求工具 ===
async function makeRequest(endpoint, options = {}) {
  const url = `${CONFIG.SERVER_URL}${endpoint}`;
  const defaultOptions = {
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': CONFIG.API_TOKEN
    }
  };
  
  const requestOptions = { ...defaultOptions, ...options };
  
  try {
    colorLog('blue', `\n📡 发送请求到: ${url}`);
    if (options.body) {
      colorLog('cyan', `📤 请求数据: ${JSON.stringify(JSON.parse(options.body), null, 2)}`);
    }
    
    const response = await fetch(url, requestOptions);
    const responseText = await response.text();
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }
    
    if (response.ok) {
      colorLog('green', `✅ 请求成功 (${response.status})`);
      colorLog('green', `📥 响应数据: ${JSON.stringify(responseData, null, 2)}`);
    } else {
      colorLog('red', `❌ 请求失败 (${response.status})`);
      colorLog('red', `📥 错误响应: ${JSON.stringify(responseData, null, 2)}`);
    }
    
    return { success: response.ok, status: response.status, data: responseData };
    
  } catch (error) {
    colorLog('red', `🚫 网络错误: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// === 测试用例 ===

// 1. 测试根路径
async function testRoot() {
  colorLog('bright', '\n=== 测试1: 根路径访问 ===');
  return await makeRequest(CONFIG.ENDPOINTS.root);
}

// 2. 健康检查
async function testHealth() {
  colorLog('bright', '\n=== 测试2: 健康检查 ===');
  return await makeRequest(CONFIG.ENDPOINTS.health);
}

// 3. 状态查询
async function testStatus() {
  colorLog('bright', '\n=== 测试3: 状态查询 ===');
  return await makeRequest(CONFIG.ENDPOINTS.status);
}

// 4. 单条有效数据测试
async function testValidData() {
  colorLog('bright', '\n=== 测试4: 单条有效数据推送 ===');
  
  const testData = {
    data: {
      outlet_code: 'TEST001',
      latitude: '-6.2088',
      longitude: '106.8456',
      nama_pemilik: '测试店主'
    }
  };
  
  return await makeRequest(CONFIG.ENDPOINTS.webhook, {
    method: 'POST',
    body: JSON.stringify(testData)
  });
}

// 5. 无效数据测试
async function testInvalidData() {
  colorLog('bright', '\n=== 测试5: 无效数据处理 ===');
  
  const invalidData = {
    data: {
      outlet_code: '', // 缺少必填字段
      latitude: 'invalid', // 无效格式
      longitude: '999', // 超出范围
      nama_pemilik: '测试店主'
    }
  };
  
  return await makeRequest(CONFIG.ENDPOINTS.webhook, {
    method: 'POST',
    body: JSON.stringify(invalidData)
  });
}

// 6. 批量数据测试
async function testBatchData() {
  colorLog('bright', '\n=== 测试6: 批量数据推送 ===');
  
  const batchData = {
    data: [
      {
        outlet_code: 'BATCH001',
        latitude: '-6.2088',
        longitude: '106.8456',
        nama_pemilik: '批量测试店主1'
      },
      {
        outlet_code: 'BATCH002',
        latitude: '-6.1744',
        longitude: '106.8294',
        nama_pemilik: '批量测试店主2'
      }
    ]
  };
  
  return await makeRequest(CONFIG.ENDPOINTS.batch, {
    method: 'POST',
    body: JSON.stringify(batchData)
  });
}

// 7. 无认证测试
async function testUnauthorized() {
  colorLog('bright', '\n=== 测试7: 无认证访问 ===');
  
  const testData = {
    data: {
      outlet_code: 'UNAUTH001',
      latitude: '-6.2088',
      longitude: '106.8456',
      nama_pemilik: '无认证测试'
    }
  };
  
  return await makeRequest(CONFIG.ENDPOINTS.webhook, {
    method: 'POST',
    body: JSON.stringify(testData),
    headers: {
      'Content-Type': 'application/json'
      // 故意不包含Authorization头
    }
  });
}

// 8. 重复数据测试
async function testDuplicateData() {
  colorLog('bright', '\n=== 测试8: 重复数据处理 ===');
  
  const duplicateData = {
    data: {
      outlet_code: 'DUP001',
      latitude: '-6.2088',
      longitude: '106.8456',
      nama_pemilik: '重复测试店主'
    }
  };
  
  colorLog('yellow', '第一次推送相同数据...');
  const result1 = await makeRequest(CONFIG.ENDPOINTS.webhook, {
    method: 'POST',
    body: JSON.stringify(duplicateData)
  });
  
  colorLog('yellow', '第二次推送相同数据...');
  const result2 = await makeRequest(CONFIG.ENDPOINTS.webhook, {
    method: 'POST',
    body: JSON.stringify(duplicateData)
  });
  
  return { first: result1, second: result2 };
}

// 9. 连接测试
async function testConnection() {
  colorLog('bright', '\n=== 测试9: 连接测试 ===');
  
  const tests = [
    { name: '根路径', test: testRoot },
    { name: '健康检查', test: testHealth }
  ];
  
  let successCount = 0;
  
  for (const { name, test } of tests) {
    colorLog('cyan', `\n正在测试: ${name}`);
    const result = await test();
    if (result.success) {
      successCount++;
      colorLog('green', `✅ ${name} - 通过`);
    } else {
      colorLog('red', `❌ ${name} - 失败`);
    }
  }
  
  colorLog('bright', `\n连接测试结果: ${successCount}/${tests.length} 通过`);
  
  if (successCount === tests.length) {
    colorLog('green', '🎉 服务器连接正常！');
  } else {
    colorLog('red', '⚠️ 服务器连接存在问题，请检查配置');
  }
  
  return { successCount, totalTests: tests.length };
}

// === 用户界面 ===
function showMenu() {
  console.log('\n' + '='.repeat(60));
  colorLog('bright', '🚀 飞书集成测试工具');
  console.log('='.repeat(60));
  colorLog('cyan', `📡 目标服务器: ${CONFIG.SERVER_URL}`);
  colorLog('cyan', `🔑 API Token: ${CONFIG.API_TOKEN.substring(0, 10)}...`);
  console.log('='.repeat(60));
  
  console.log('\n请选择要执行的测试:');
  console.log('1. 🌐 根路径访问测试');
  console.log('2. ❤️  健康检查测试');
  console.log('3. 📊 状态查询测试');
  console.log('4. 📝 单条有效数据推送测试');
  console.log('5. ❌ 无效数据处理测试');
  console.log('6. 📦 批量数据推送测试');
  console.log('7. 🔒 无认证访问测试');
  console.log('8. 🔄 重复数据处理测试');
  console.log('9. 🔗 连接测试 (推荐首次使用)');
  console.log('0. 🚪 退出');
  console.log('\n='.repeat(60));
}

function showResults(results) {
  console.log('\n' + '='.repeat(60));
  colorLog('bright', '📋 测试结果汇总');
  console.log('='.repeat(60));
  
  results.forEach((result, index) => {
    const status = result.success ? '✅ 通过' : '❌ 失败';
    const color = result.success ? 'green' : 'red';
    colorLog(color, `${index + 1}. ${status} - ${result.name}`);
  });
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log('\n' + '-'.repeat(40));
  colorLog('bright', `总计: ${successCount}/${totalCount} 测试通过`);
  
  if (successCount === totalCount) {
    colorLog('green', '🎉 所有测试都通过了！系统运行正常。');
  } else {
    colorLog('yellow', '⚠️ 部分测试失败，请检查相关功能。');
  }
}

async function runTests() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const testFunctions = {
    '1': { name: '根路径访问', func: testRoot },
    '2': { name: '健康检查', func: testHealth },
    '3': { name: '状态查询', func: testStatus },
    '4': { name: '单条有效数据推送', func: testValidData },
    '5': { name: '无效数据处理', func: testInvalidData },
    '6': { name: '批量数据推送', func: testBatchData },
    '7': { name: '无认证访问', func: testUnauthorized },
    '8': { name: '重复数据处理', func: testDuplicateData },
    '9': { name: '连接测试', func: testConnection }
  };
  
  let testResults = [];
  
  while (true) {
    showMenu();
    
    const choice = await new Promise(resolve => {
      rl.question('\n请输入选择 (0-9): ', resolve);
    });
    
    if (choice === '0') {
      colorLog('bright', '\n👋 感谢使用飞书集成测试工具！');
      if (testResults.length > 0) {
        showResults(testResults);
      }
      break;
    }
    
    if (testFunctions[choice]) {
      const { name, func } = testFunctions[choice];
      
      colorLog('bright', `\n🚀 开始执行: ${name}`);
      console.log('-'.repeat(40));
      
      try {
        const startTime = Date.now();
        const result = await func();
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        testResults.push({
          name,
          success: result.success !== false,
          duration,
          result
        });
        
        colorLog('cyan', `\n⏱️ 测试耗时: ${duration}ms`);
        
        // 添加重试机制
        if (!result.success && choice !== '5' && choice !== '7') {
          colorLog('yellow', '\n❓ 测试失败，是否重试？ (y/n)');
          const retry = await new Promise(resolve => {
            rl.question('', resolve);
          });
          
          if (retry.toLowerCase() === 'y') {
            colorLog('blue', '🔄 正在重试...');
            const retryResult = await func();
            if (retryResult.success) {
              colorLog('green', '✅ 重试成功！');
              testResults[testResults.length - 1].success = true;
            } else {
              colorLog('red', '❌ 重试仍然失败');
            }
          }
        }
        
      } catch (error) {
        colorLog('red', `🚫 测试执行失败: ${error.message}`);
        testResults.push({
          name,
          success: false,
          error: error.message
        });
      }
      
      colorLog('cyan', '\n按回车键继续...');
      await new Promise(resolve => {
        rl.question('', resolve);
      });
      
    } else {
      colorLog('red', '❌ 无效选择，请重新输入');
    }
  }
  
  rl.close();
}

// === 启动信息 ===
function showStartupInfo() {
  console.clear();
  console.log('\n' + '='.repeat(60));
  colorLog('bright', '🚀 飞书集成测试工具启动中...');
  console.log('='.repeat(60));
  
  colorLog('green', '✅ 测试工具已就绪');
  colorLog('blue', '📡 目标服务器: ' + CONFIG.SERVER_URL);
  colorLog('yellow', '💡 建议首次使用时运行"连接测试"');
  
  console.log('\n使用说明:');
  console.log('• 确保您的服务器正在运行');
  console.log('• 检查API_TOKEN配置是否正确');
  console.log('• 建议按顺序执行测试用例');
  console.log('• 如果是Render部署，首次访问可能需要30秒唤醒时间');
  
  colorLog('cyan', '\n按回车键开始...');
}

// === 主函数 ===
async function main() {
  showStartupInfo();
  
  // 等待用户按回车
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  await new Promise(resolve => {
    rl.question('', resolve);
  });
  
  rl.close();
  
  // 开始测试
  await runTests();
}

// 启动程序
if (require.main === module) {
  main().catch(error => {
    colorLog('red', `🚫 程序启动失败: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  testRoot,
  testHealth,
  testStatus,
  testValidData,
  testInvalidData,
  testBatchData,
  testUnauthorized,
  testDuplicateData,
  testConnection
}; 