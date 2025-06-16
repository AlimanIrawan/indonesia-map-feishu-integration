#!/usr/bin/env node

const axios = require('axios');

// 测试配置
const WEBHOOK_URL = 'https://indonesia-map-feishu-integration.onrender.com/webhook';

// 模拟飞书可能发送的不同字段名格式
const testCases = [
  {
    name: '测试1：标准字段名',
    data: {
      record: {
        fields: {
          'Outlet Code': '250429104405',
          latitude: '-6.111696',
          longitude: '106.914977',
          'Nama Pemilik': 'Ibu Tati',
          brand: 'Aice',
          kecamatan: 'Jakarta Pusat'
        }
      }
    }
  },
  {
    name: '测试2：小写字段名',
    data: {
      record: {
        fields: {
          outlet_code: '250430122437',
          latitude: '-6.1289746',
          longitude: '106.9044603',
          nama_pemilik: 'Ibu Wisma',
          brand: 'Walls'
        }
      }
    }
  },
  {
    name: '测试3：混合字段名',
    data: {
      record: {
        fields: {
          shop_code: '250430134841',
          Latitude: '-6.1127737',
          Longitude: '106.8960298',
          'outlet name': 'Bapak Komarudin',
          Brand: 'Campina',
          Kecamatan: 'Bekasi'
        }
      }
    }
  },
  {
    name: '测试4：只有必填字段',
    data: {
      record: {
        fields: {
          'Outlet Code': '250505151120',
          latitude: '-6.111844',
          longitude: '106.8909567',
          'Nama Pemilik': 'Ibu Yeni Efrina'
        }
      }
    }
  },
  {
    name: '测试5：缺少必填字段（应该失败）',
    data: {
      record: {
        fields: {
          'Outlet Code': '250429095223',
          latitude: '-6.1281265',
          // 缺少longitude
          'Nama Pemilik': 'Bapak Amir'
        }
      }
    }
  }
];

async function runTests() {
  console.log('🧪 开始测试飞书字段映射...\n');
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n📋 ${testCase.name}`);
    console.log('发送数据:', JSON.stringify(testCase.data, null, 2));
    
    try {
      const response = await axios.post(WEBHOOK_URL, testCase.data, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      if (response.status === 200) {
        console.log('✅ 测试通过');
        console.log('响应:', response.data);
        passedTests++;
      } else {
        console.log('❌ 测试失败');
        console.log('状态码:', response.status);
        console.log('响应:', response.data);
      }
      
    } catch (error) {
      if (testCase.name.includes('应该失败')) {
        console.log('✅ 预期失败 - 测试通过');
        console.log('错误信息:', error.response?.data?.error || error.message);
        passedTests++;
      } else {
        console.log('❌ 测试失败');
        console.log('错误:', error.response?.data || error.message);
      }
    }
    
    // 等待1秒再进行下一个测试
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 测试结果: ${passedTests}/${totalTests} 通过`);
  console.log('='.repeat(50));
  
  if (passedTests === totalTests) {
    console.log('🎉 所有测试都通过了！');
  } else {
    console.log('⚠️  部分测试失败，请检查配置');
  }
}

// 检查服务器状态
async function checkServerStatus() {
  try {
    console.log('🔍 检查服务器状态...');
    const response = await axios.get('https://indonesia-map-feishu-integration.onrender.com/health');
    console.log('✅ 服务器状态正常');
    console.log('服务器信息:', response.data);
    return true;
  } catch (error) {
    console.log('❌ 服务器连接失败:', error.message);
    return false;
  }
}

// 主函数
async function main() {
  console.log('🚀 飞书字段映射测试工具');
  console.log('======================================');
  
  // 检查服务器状态
  const serverOk = await checkServerStatus();
  if (!serverOk) {
    console.log('请等待Render服务器启动完成后再试');
    process.exit(1);
  }
  
  // 运行测试
  await runTests();
  
  console.log('\n💡 测试完成！如果测试通过，说明飞书自动化应该能正常工作了。');
}

// 运行主函数
main().catch(error => {
  console.error('测试过程出错:', error.message);
  process.exit(1);
}); 