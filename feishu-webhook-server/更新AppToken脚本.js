/**
 * 飞书App Token更新脚本
 * 用于快速更新多维表格App Token配置
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 创建交互界面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 飞书App Token更新工具');
console.log('=====================================\n');

// 显示当前配置
function showCurrentConfig() {
  try {
    const configPath = path.join(__dirname, '飞书自动化模板.js');
    const content = fs.readFileSync(configPath, 'utf8');
    
    // 提取当前的App Token
    const appTokenMatch = content.match(/appToken:\s*['"`]([^'"`]+)['"`]/);
    const tableIdMatch = content.match(/tableId:\s*['"`]([^'"`]+)['"`]/);
    
    console.log('📋 当前配置信息：');
    console.log('─────────────────────────────────────');
    console.log('App Token:', appTokenMatch ? appTokenMatch[1] : '未找到');
    console.log('Table ID:', tableIdMatch ? tableIdMatch[1] : '未找到');
    console.log('');
    
    // 分析当前Token格式
    if (appTokenMatch) {
      const currentToken = appTokenMatch[1];
      console.log('🔍 Token格式分析：');
      
      if (currentToken.startsWith('basc')) {
        console.log('✅ Token格式正确（以basc开头）');
      } else {
        console.log('❌ Token格式可能错误');
        console.log('   - 当前Token:', currentToken);
        console.log('   - 正确格式应以"basc"开头');
      }
      console.log('');
    }
    
    return { appTokenMatch, tableIdMatch, content, configPath };
  } catch (error) {
    console.error('❌ 读取配置文件失败:', error.message);
    return null;
  }
}

// 验证Token格式
function validateToken(token) {
  const errors = [];
  
  if (!token || token.trim() === '') {
    errors.push('Token不能为空');
  } else {
    const trimmedToken = token.trim();
    
    if (!trimmedToken.startsWith('basc')) {
      errors.push('Token应该以"basc"开头');
    }
    
    if (trimmedToken.length < 20) {
      errors.push('Token长度可能太短（应该20-30个字符）');
    }
    
    if (!/^[a-zA-Z0-9]+$/.test(trimmedToken)) {
      errors.push('Token只能包含字母和数字');
    }
  }
  
  return errors;
}

// 更新配置文件
function updateConfig(configPath, content, newAppToken, newTableId) {
  try {
    let updatedContent = content;
    
    // 更新App Token
    if (newAppToken) {
      updatedContent = updatedContent.replace(
        /appToken:\s*['"`][^'"`]+['"`]/,
        `appToken: '${newAppToken}'`
      );
    }
    
    // 更新Table ID（如果提供）
    if (newTableId) {
      updatedContent = updatedContent.replace(
        /tableId:\s*['"`][^'"`]+['"`]/,
        `tableId: '${newTableId}'`
      );
    }
    
    // 备份原文件
    const backupPath = configPath + '.backup.' + Date.now();
    fs.writeFileSync(backupPath, content);
    console.log('📁 已创建备份文件:', path.basename(backupPath));
    
    // 写入新配置
    fs.writeFileSync(configPath, updatedContent);
    console.log('✅ 配置文件已更新');
    
    return true;
  } catch (error) {
    console.error('❌ 更新配置文件失败:', error.message);
    return false;
  }
}

// 主交互流程
async function main() {
  console.log('📖 使用说明：');
  console.log('1. 首先获取正确的多维表格App Token');
  console.log('2. 输入新的App Token进行更新');
  console.log('3. 可选：同时更新Table ID');
  console.log('');
  
  const configInfo = showCurrentConfig();
  if (!configInfo) {
    rl.close();
    return;
  }
  
  console.log('🎯 App Token获取方法：');
  console.log('1. 打开飞书多维表格，点击"分享"按钮');
  console.log('2. 从分享链接中提取，格式：https://xxx.feishu.cn/base/[AppToken]?table=...');
  console.log('3. 正确的Token以"basc"开头，如：bascXXXXXXXXXXXXXX');
  console.log('');
  
  // 获取新的App Token
  const newAppToken = await new Promise((resolve) => {
    rl.question('🔑 请输入新的App Token（或按回车跳过）: ', (answer) => {
      resolve(answer.trim());
    });
  });
  
  if (newAppToken) {
    // 验证Token格式
    const tokenErrors = validateToken(newAppToken);
    if (tokenErrors.length > 0) {
      console.log('\n⚠️  Token格式警告：');
      tokenErrors.forEach(error => console.log('   -', error));
      
      const confirm = await new Promise((resolve) => {
        rl.question('\n❓ 是否仍要继续更新？(y/N): ', (answer) => {
          resolve(answer.toLowerCase().startsWith('y'));
        });
      });
      
      if (!confirm) {
        console.log('❌ 更新已取消');
        rl.close();
        return;
      }
    }
  }
  
  // 获取新的Table ID（可选）
  const newTableId = await new Promise((resolve) => {
    rl.question('📊 请输入新的Table ID（或按回车保持不变）: ', (answer) => {
      resolve(answer.trim());
    });
  });
  
  // 确认更新
  if (!newAppToken && !newTableId) {
    console.log('ℹ️  没有提供新的配置，无需更新');
    rl.close();
    return;
  }
  
  console.log('\n📝 准备更新的配置：');
  if (newAppToken) {
    console.log('新的App Token:', newAppToken);
  }
  if (newTableId) {
    console.log('新的Table ID:', newTableId);
  }
  
  const finalConfirm = await new Promise((resolve) => {
    rl.question('\n✅ 确认更新配置？(Y/n): ', (answer) => {
      resolve(!answer.toLowerCase().startsWith('n'));
    });
  });
  
  if (finalConfirm) {
    const success = updateConfig(
      configInfo.configPath,
      configInfo.content,
      newAppToken || null,
      newTableId || null
    );
    
    if (success) {
      console.log('\n🎉 配置更新成功！');
      console.log('\n📋 下一步操作：');
      console.log('1. 运行测试验证：node 飞书API权限诊断脚本.js');
      console.log('2. 如果测试通过，运行同步：node 飞书自动化模板.js');
    }
  } else {
    console.log('❌ 更新已取消');
  }
  
  rl.close();
}

// 启动脚本
main().catch(error => {
  console.error('❌ 脚本执行失败:', error.message);
  rl.close();
}); 