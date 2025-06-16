/**
 * 飞书API权限诊断脚本
 * 用于排查91402 NOTEXIST错误
 */

const axios = require('axios');

// 配置信息
const CONFIG = {
  feishu: {
    appId: 'cli_a8c55c2b3268900e',
    appSecret: 'kEOPt0k9hIMrVg82xqafgdbQZPYlCr8l',
    baseUrl: 'https://open.feishu.cn'
  },
  bitable: {
    appToken: 'HEqVwhzBciH75KkD0ZclpFQugnJ',
    tableId: 'tblr5cr35dwKZaj1'
  }
};

console.log('🔍 开始飞书API权限诊断...\n');

// 步骤1：获取access token
async function step1_getAccessToken() {
  console.log('📋 步骤1: 获取访问令牌');
  console.log('App ID:', CONFIG.feishu.appId);
  console.log('API地址:', `${CONFIG.feishu.baseUrl}/open-apis/auth/v3/tenant_access_token/internal`);
  
  try {
    const response = await axios.post(`${CONFIG.feishu.baseUrl}/open-apis/auth/v3/tenant_access_token/internal`, {
      app_id: CONFIG.feishu.appId,
      app_secret: CONFIG.feishu.appSecret
    });

    console.log('API响应状态:', response.status);
    console.log('响应数据:', response.data);

    if (response.data.code === 0) {
      console.log('✅ 访问令牌获取成功');
      console.log('Token有效期:', response.data.expire, '秒');
      return response.data.tenant_access_token;
    } else {
      console.log('❌ 访问令牌获取失败');
      console.log('错误代码:', response.data.code);
      console.log('错误消息:', response.data.msg);
      return null;
    }
  } catch (error) {
    console.log('❌ 请求失败:', error.message);
    if (error.response) {
      console.log('HTTP状态:', error.response.status);
      console.log('响应数据:', error.response.data);
    }
    return null;
  }
}

// 步骤2：检查应用信息
async function step2_checkAppInfo(accessToken) {
  console.log('\n📋 步骤2: 检查应用信息和权限');
  
  try {
    const response = await axios.get(`${CONFIG.feishu.baseUrl}/open-apis/application/v6/applications/self`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('应用信息API响应:', response.data);
    
    if (response.data.code === 0) {
      const app = response.data.data.app;
      console.log('✅ 应用基本信息:');
      console.log('- 应用名称:', app.app_name);
      console.log('- 应用类型:', app.app_type);
      console.log('- 应用状态:', app.status);
      console.log('- 创建时间:', new Date(parseInt(app.create_time) * 1000).toLocaleString());
      
      // 检查权限范围
      if (app.app_scene_type) {
        console.log('- 应用场景:', app.app_scene_type);
      }
    } else {
      console.log('❌ 获取应用信息失败:', response.data.msg);
    }
  } catch (error) {
    console.log('❌ 检查应用信息失败:', error.message);
    if (error.response) {
      console.log('响应数据:', error.response.data);
    }
  }
}

// 步骤3：检查多维表格应用是否存在
async function step3_checkBitableApp(accessToken) {
  console.log('\n📋 步骤3: 检查多维表格应用');
  console.log('App Token:', CONFIG.bitable.appToken);
  
  try {
    const response = await axios.get(`${CONFIG.feishu.baseUrl}/open-apis/bitable/v1/apps/${CONFIG.bitable.appToken}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('多维表格应用API响应:', response.data);
    
    if (response.data.code === 0) {
      const app = response.data.data.app;
      console.log('✅ 多维表格应用存在:');
      console.log('- 应用名称:', app.name);
      console.log('- 创建时间:', new Date(parseInt(app.time_zone) * 1000).toLocaleString() || '未知');
      console.log('- 是否开启高级权限:', app.is_advanced);
      return true;
    } else {
      console.log('❌ 多维表格应用不存在或无权限访问');
      console.log('错误代码:', response.data.code);
      console.log('错误消息:', response.data.msg);
      return false;
    }
  } catch (error) {
    console.log('❌ 检查多维表格应用失败:', error.message);
    if (error.response) {
      console.log('HTTP状态:', error.response.status);
      console.log('响应数据:', error.response.data);
    }
    return false;
  }
}

// 步骤4：获取多维表格列表
async function step4_listTables(accessToken) {
  console.log('\n📋 步骤4: 获取多维表格列表');
  
  try {
    const response = await axios.get(`${CONFIG.feishu.baseUrl}/open-apis/bitable/v1/apps/${CONFIG.bitable.appToken}/tables`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('数据表列表API响应:', response.data);
    
    if (response.data.code === 0) {
      const tables = response.data.data.items;
      console.log(`✅ 找到 ${tables.length} 个数据表:`);
      
      tables.forEach((table, index) => {
        console.log(`${index + 1}. 表名: ${table.name}`);
        console.log(`   表ID: ${table.table_id}`);
        console.log(`   字段数: ${table.field_count || '未知'}`);
        console.log(`   记录数: ${table.record_count || '未知'}`);
        
        if (table.table_id === CONFIG.bitable.tableId) {
          console.log('   🎯 这是我们要访问的目标表!');
        }
        console.log('');
      });
      
      return tables;
    } else {
      console.log('❌ 获取数据表列表失败');
      console.log('错误代码:', response.data.code);
      console.log('错误消息:', response.data.msg);
      return [];
    }
  } catch (error) {
    console.log('❌ 获取数据表列表失败:', error.message);
    if (error.response) {
      console.log('响应数据:', error.response.data);
    }
    return [];
  }
}

// 步骤5：尝试访问目标表格
async function step5_accessTargetTable(accessToken) {
  console.log('\n📋 步骤5: 尝试访问目标表格');
  console.log('目标表ID:', CONFIG.bitable.tableId);
  
  try {
    // 先获取表格信息
    const tableResponse = await axios.get(`${CONFIG.feishu.baseUrl}/open-apis/bitable/v1/apps/${CONFIG.bitable.appToken}/tables/${CONFIG.bitable.tableId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('目标表格信息API响应:', tableResponse.data);
    
    if (tableResponse.data.code === 0) {
      const table = tableResponse.data.data.table;
      console.log('✅ 目标表格存在:');
      console.log('- 表名:', table.name);
      console.log('- 表ID:', table.table_id);
    } else {
      console.log('❌ 目标表格不存在或无权限访问');
      console.log('错误代码:', tableResponse.data.code);
      console.log('错误消息:', tableResponse.data.msg);
      return false;
    }

    // 尝试获取记录（这是关键测试）
    console.log('\n🔍 尝试获取表格记录...');
    const recordsResponse = await axios.get(`${CONFIG.feishu.baseUrl}/open-apis/bitable/v1/apps/${CONFIG.bitable.appToken}/tables/${CONFIG.bitable.tableId}/records`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        page_size: 1 // 只获取一条记录进行测试
      }
    });

    console.log('记录获取API响应:', recordsResponse.data);
    
    if (recordsResponse.data.code === 0) {
      console.log('✅ 成功访问表格记录');
      console.log('记录总数指示:', recordsResponse.data.data.total);
      console.log('返回记录数:', recordsResponse.data.data.items?.length || 0);
      return true;
    } else {
      console.log('❌ 获取表格记录失败 - 这是91402错误的来源！');
      console.log('错误代码:', recordsResponse.data.code);
      console.log('错误消息:', recordsResponse.data.msg);
      return false;
    }

  } catch (error) {
    console.log('❌ 访问目标表格失败:', error.message);
    if (error.response) {
      console.log('HTTP状态:', error.response.status);
      console.log('响应数据:', error.response.data);
      
      // 特别处理91402错误
      if (error.response.data?.code === 91402) {
        console.log('\n🚨 发现91402错误！');
        console.log('可能原因分析:');
        console.log('1. 应用没有访问这个多维表格的权限');
        console.log('2. 表格ID不正确');
        console.log('3. 应用权限配置有问题');
        console.log('4. 表格可能被删除或移动');
      }
    }
    return false;
  }
}

// 步骤6：权限诊断建议
function step6_generateAdvice(results) {
  console.log('\n📋 步骤6: 诊断结果和建议');
  console.log('==========================================');
  
  if (!results.tokenSuccess) {
    console.log('🚨 主要问题: 无法获取访问令牌');
    console.log('建议:');
    console.log('1. 检查App ID和App Secret是否正确');
    console.log('2. 确认应用状态是否正常');
    console.log('3. 检查网络连接');
    return;
  }

  if (!results.appCheckSuccess) {
    console.log('⚠️  应用信息检查失败，但Token获取成功');
    console.log('建议继续下一步诊断');
  }

  if (!results.bitableAppSuccess) {
    console.log('🚨 主要问题: 无法访问多维表格应用');
    console.log('建议:');
    console.log('1. 检查App Token (HEqVwhzBciH75KkD0ZclpFQugnJ) 是否正确');
    console.log('2. 确认您的飞书应用是否有访问这个多维表格的权限');
    console.log('3. 在飞书开发者后台检查应用权限配置');
    console.log('4. 确认多维表格是否还存在');
    return;
  }

  if (!results.tableAccessSuccess) {
    console.log('🚨 主要问题: 可以访问多维表格应用，但无法访问目标数据表');
    console.log('建议:');
    console.log('1. 检查表ID (tblr5cr35dwKZaj1) 是否正确');
    console.log('2. 确认表格是否存在于多维表格应用中');
    console.log('3. 检查应用是否有读取表格内容的权限');
    console.log('4. 尝试重新分享多维表格给应用');
    return;
  }

  console.log('✅ 所有检查通过！91402错误可能是临时问题');
  console.log('建议:');
  console.log('1. 重试API调用');
  console.log('2. 检查是否有并发限制');
  console.log('3. 确认网络稳定性');
}

// 主函数
async function main() {
  const results = {
    tokenSuccess: false,
    appCheckSuccess: false,
    bitableAppSuccess: false,
    tableListSuccess: false,
    tableAccessSuccess: false
  };

  // 步骤1: 获取Token
  const accessToken = await step1_getAccessToken();
  if (!accessToken) {
    step6_generateAdvice(results);
    return;
  }
  results.tokenSuccess = true;

  // 步骤2: 检查应用信息
  await step2_checkAppInfo(accessToken);
  results.appCheckSuccess = true;

  // 步骤3: 检查多维表格应用
  const bitableAppExists = await step3_checkBitableApp(accessToken);
  if (!bitableAppExists) {
    step6_generateAdvice(results);
    return;
  }
  results.bitableAppSuccess = true;

  // 步骤4: 获取表格列表
  const tables = await step4_listTables(accessToken);
  results.tableListSuccess = tables.length > 0;

  // 步骤5: 访问目标表格
  const tableAccessSuccess = await step5_accessTargetTable(accessToken);
  results.tableAccessSuccess = tableAccessSuccess;

  // 步骤6: 生成建议
  step6_generateAdvice(results);
}

// 运行诊断
main().catch(error => {
  console.error('❌ 诊断脚本执行失败:', error.message);
}); 