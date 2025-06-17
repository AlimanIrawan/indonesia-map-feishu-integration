exports.handler = async (event, context) => {
  try {
    // 直接从GitHub获取CSV数据
    const response = await fetch('https://raw.githubusercontent.com/AlimanIrawan/indonesia-map-feishu-integration/main/public/markers.csv');
    
    if (!response.ok) {
      throw new Error(`GitHub响应错误: ${response.status}`);
    }
    
    const csvData = await response.text();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Cache-Control': 'no-cache'
      },
      body: csvData
    };
  } catch (error) {
    console.error('代理错误:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: '无法获取数据', details: error.message })
    };
  }
}; 