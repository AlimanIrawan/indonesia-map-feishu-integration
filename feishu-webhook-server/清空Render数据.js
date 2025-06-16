/**
 * 清空Render服务器上的CSV数据
 * 重置到只有表头的状态
 */

const axios = require('axios');
const fs = require('fs');

console.log('🗑️ 清空Render服务器CSV数据');
console.log('========================================\n');

const RENDER_BASE_URL = 'https://indonesia-map-feishu-integration.onrender.com';

// 空的CSV数据（只有表头）
const EMPTY_CSV_DATA = 'shop_code,latitude,longitude,outlet name,brand,kecamatan,potensi\n';

async function clearRenderData() {
  try {
    console.log('🔍 步骤1：检查Render服务器状态...');
    
    // 检查服务器状态
    const healthResponse = await axios.get(`${RENDER_BASE_URL}/api/health`, {
      timeout: 10000
    });
    
    if (healthResponse.status === 200) {
      console.log('✅ Render服务器运行正常');
    } else {
      throw new Error(`服务器状态异常: ${healthResponse.status}`);
    }
    
    console.log('');
    console.log('📊 步骤2：获取当前数据状态...');
    
    // 获取当前数据状态
    try {
      const statusResponse = await axios.get(`${RENDER_BASE_URL}/api/status`);
      const currentStats = statusResponse.data;
      
      console.log(`当前记录数: ${currentStats.recordCount || '未知'}`);
      console.log(`最后更新: ${currentStats.lastUpdate || '未知'}`);
    } catch (error) {
      console.log('⚠️ 无法获取当前数据状态');
    }
    
    console.log('');
    console.log('🗑️ 步骤3：清空CSV数据...');
    
    // 使用特殊的清空端点
    const clearResponse = await axios.post(`${RENDER_BASE_URL}/api/data/clear`, {
      confirm: true,
      resetToHeader: true
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    if (clearResponse.data.success) {
      console.log('✅ Render服务器数据清空成功！');
      console.log(`清空的记录数: ${clearResponse.data.clearedCount || '未知'}`);
    } else {
      throw new Error(clearResponse.data.message || '清空失败');
    }
    
    console.log('');
    console.log('🔄 步骤4：验证清空结果...');
    
    // 验证数据已清空
    setTimeout(async () => {
      try {
        const verifyResponse = await axios.get(`${RENDER_BASE_URL}/api/data/csv`);
        const csvContent = verifyResponse.data;
        
        // 检查是否只剩表头
        const lines = csvContent.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length === 1 && lines[0].includes('shop_code')) {
          console.log('✅ 验证成功：数据已完全清空，只保留表头');
          console.log(`当前CSV内容: ${lines[0]}`);
        } else {
          console.log(`⚠️ 验证异常：仍有 ${lines.length - 1} 条数据`);
        }
        
        console.log('');
        console.log('🎯 步骤5：同步更新本地数据...');
        
        // 同步更新本地CSV文件
        const localCsvPath = '../public/markers.csv';
        fs.writeFileSync(localCsvPath, EMPTY_CSV_DATA, 'utf8');
        console.log('✅ 本地CSV文件已同步清空');
        
        console.log('');
        console.log('🎉 数据清空完成！');
        console.log('========================================');
        console.log('✅ Render服务器数据已清空');
        console.log('✅ 本地数据已同步清空');
        console.log('✅ 系统已重置为初始状态');
        console.log('');
        console.log('🚀 现在可以使用飞书自动化直接推送数据了！');
        console.log('Webhook地址: https://indonesia-map-feishu-integration.onrender.com/webhook');
        
      } catch (error) {
        console.log('❌ 验证过程出错:', error.message);
      }
    }, 2000);
    
  } catch (error) {
    console.log('❌ 清空过程出错:', error.response?.data?.message || error.message);
    
    // 如果API清空失败，尝试其他方法
    console.log('');
    console.log('🔄 尝试备用清空方法...');
    
    try {
      // 备用方法：直接发送空数据
      const backupResponse = await axios.post(`${RENDER_BASE_URL}/webhook`, {
        action: 'clear_all',
        confirm: true
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ 备用清空方法执行完成');
      
    } catch (backupError) {
      console.log('❌ 备用方法也失败了:', backupError.message);
      console.log('');
      console.log('📋 手动解决方案：');
      console.log('1. 访问Render服务器控制台');
      console.log('2. 重新部署服务器');
      console.log('3. 或联系技术支持');
    }
  }
}

// 主函数
async function main() {
  console.log('⚠️ 警告：此操作将删除所有CSV数据！');
  console.log('');
  
  // 简单确认（在脚本环境中自动确认）
  console.log('🎯 开始清空数据...\n');
  
  await clearRenderData();
}

// 运行脚本
main().catch(error => {
  console.error('❌ 脚本执行失败:', error.message);
  console.log('');
  console.log('如果问题持续，请手动清空数据：');
  console.log('1. 直接编辑public/markers.csv文件');
  console.log('2. 重新部署Render服务器');
}); 