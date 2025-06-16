const axios = require('axios');

// Render服务器URL
const RENDER_URL = 'https://indonesia-map-feishu-integration.onrender.com';

// 测试用例：各种文本格式的经纬度
const testCases = [
  {
    name: '测试1: 纯数字文本格式（飞书默认）',
    data: {
      record: {
        fields: {
          "Outlet Code": "TEST001",
          "latitude": "-6.129809999300173",  // 文本格式
          "longitude": "106.94099989600046", // 文本格式
          "Nama Pemilik": "测试店主1"
        }
      }
    }
  },
  {
    name: '测试2: 带前缀的文本格式',
    data: {
      record: {
        fields: {
          "Outlet Code": "TEST002",
          "latitude": "纬度:-6.150000",      // 带前缀
          "longitude": "经度:106.950000",    // 带前缀
          "Nama Pemilik": "测试店主2"
        }
      }
    }
  },
  {
    name: '测试3: 带空格的文本格式',
    data: {
      record: {
        fields: {
          "Outlet Code": "TEST003",
          "latitude": "  -6.170000  ",      // 前后空格
          "longitude": "  106.970000  ",    // 前后空格
          "Nama Pemilik": "测试店主3"
        }
      }
    }
  },
  {
    name: '测试4: 您实际的数据格式',
    data: {
      record: {
        fields: {
          "Outlet Code": "250616162606",
          "latitude": "-6.129809999300173",
          "longitude": "106.94099989600046",
          "Nama Pemilik": "Ibu Unasih"
        }
      }
    }
  }
];

async function runTests() {
  console.log('🧪 开始测试文本格式经纬度处理...\n');
  
  // 先清空现有数据
  console.log('🗑️ 清空现有测试数据...');
  try {
    await axios.post(`${RENDER_URL}/api/data/clear`, { confirm: true });
    console.log('✅ 数据清空成功\n');
  } catch (error) {
    console.log('⚠️ 清空数据失败，继续测试...\n');
  }
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`${i + 1}. ${testCase.name}`);
    console.log('发送数据:', JSON.stringify(testCase.data, null, 2));
    
    try {
      const response = await axios.post(`${RENDER_URL}/webhook`, testCase.data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ 成功!');
      console.log('响应状态:', response.status);
      console.log('响应数据:', response.data);
      
    } catch (error) {
      console.log('❌ 失败!');
      if (error.response) {
        console.log('错误状态:', error.response.status);
        console.log('错误信息:', error.response.data);
      } else {
        console.log('网络错误:', error.message);
      }
    }
    
    console.log(''.padEnd(50, '-'));
    console.log('');
  }
  
  console.log('🔍 测试完成，检查当前CSV数据...');
  try {
    const csvResponse = await axios.get(`${RENDER_URL}/api/data/csv`);
    console.log('当前CSV数据:');
    console.log(csvResponse.data);
  } catch (error) {
    console.log('❌ 无法获取CSV数据:', error.message);
  }
}

runTests(); 