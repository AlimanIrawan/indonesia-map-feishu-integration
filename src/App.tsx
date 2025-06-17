import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, GeoJSON, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import logoBase64 from './logo.js'; // 导入Base64编码的Logo图片
import L from 'leaflet';

interface MarkerData {
  latitude: number;
  longitude: number;
  outletName: string;
  brand: string[];
  displayBrand: string;
  isMultiBrand: boolean;
  shopCode: string;
  kecamatan: string;
  isPotential: boolean;
}

// 颜色统计接口
interface ColorCount {
  [key: string]: number;
}

// 颜色选择状态接口
interface ColorSelection {
  [key: string]: boolean;
}

// 更新品牌颜色映射
const BRAND_COLORS: { [key: string]: string } = {
  'halocoko': '#8B4513',      // 棕色
  'Aice': '#4169E1',         // 蓝色
  'Campina': '#FFB6C1',      // 粉色
  'Joyday': '#FFD700',       // 黄色
  'Walls': '#FF0000',        // 红色
  'glico': '#008B8B',        // 深青色（深色版，与[Kosong]区分）
  'Diamond': '#9400D3',      // 深紫色
  '[Kosong]': '#90EE90',     // 浅绿色
  '[Tidak Bisa]': '#000000', // 黑色
  'Other': '#808080',        // 灰色
  'Multi-brand': '#9932CC'   // 紫色
};

type BrandType = keyof typeof BRAND_COLORS;

// 获取颜色函数
const getMarkerColor = (brand: string): string => {
  return BRAND_COLORS[brand as BrandType] || BRAND_COLORS.Other;
};

// 添加定位组件
const LocationMarker: React.FC = () => {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const map = useMap();

  // 手动触发定位
  const startLocating = () => {
    setIsLocating(true);
    setLocationError(null);

    // 检查浏览器是否支持地理定位
    if (!navigator.geolocation) {
      setLocationError('您的浏览器不支持地理定位');
      setIsLocating(false);
      return;
    }

    // 使用高精度定位选项
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserPosition([latitude, longitude]);
        map.flyTo([latitude, longitude], map.getZoom());
        setIsLocating(false);
      },
      (error) => {
        console.error('定位错误:', error);
        let errorMessage = '无法获取位置';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '请允许访问位置信息';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '位置信息不可用';
            break;
          case error.TIMEOUT:
            errorMessage = '获取位置超时';
            break;
        }
        setLocationError(errorMessage);
        setIsLocating(false);
      },
      options
    );
  };

  useEffect(() => {
    // 清理函数
    return () => {
      if (userPosition) {
        setUserPosition(null);
      }
    };
  }, [userPosition]);

  return (
    <>
      <button 
        onClick={startLocating}
        className={`control-button location-button ${isLocating ? 'locating' : ''}`}
        disabled={isLocating}
        title={isLocating ? '正在定位...' : '获取我的位置'}
      >
        📍
      </button>
      {locationError && <div className="location-error">{locationError}</div>}

      {userPosition && (
        <CircleMarker
          center={userPosition}
          radius={10}
          pathOptions={{
            fillColor: '#3388ff',
            fillOpacity: 0.7,
            color: '#fff',
            weight: 3,
            opacity: 1
          }}
        >
          <Popup>
            <div>
              <h3>您的当前位置</h3>
              <p>纬度: {userPosition[0].toFixed(6)}</p>
              <p>经度: {userPosition[1].toFixed(6)}</p>
            </div>
          </Popup>
        </CircleMarker>
      )}
    </>
  );
};

// 明确列出常规品牌和特殊品牌
const REGULAR_BRANDS = ['halocoko', 'Aice', 'Campina', 'Walls', 'Joyday', 'glico', 'Diamond', 'Other'];
const SPECIAL_BRANDS = ['Potential', '[Kosong]', '[Tidak Bisa]', 'Multi-brand'];

// 添加一个工具函数来处理大数字
const formatLargeNumber = (num: string): string => {
  // 移除所有非数字字符
  const cleanNum = num.replace(/[^\d]/g, '');
  // 如果是科学计数法格式，转换为普通数字
  if (cleanNum.includes('e') || cleanNum.includes('E')) {
    // 使用BigInt来处理大数字，避免科学计数法
    try {
      return BigInt(cleanNum).toString().padStart(12, '0');
    } catch {
      // 如果转换失败，尝试使用Number
      return Number(cleanNum).toFixed(0).padStart(12, '0');
    }
  }
  // 确保返回12位数字
  return cleanNum.padStart(12, '0');
};

// 添加一个工具函数来扩展shop_code到12位
const ensureShopCodeLength = (code: string): string => {
  // 首先确保数字格式正确
  const formattedCode = formatLargeNumber(code);
  // 如果长度不足12位，在前面补0
  return formattedCode.padStart(12, '0');
};

// 添加区域GeoJSON数据接口
interface RegionGeoJSON {
  name: string;
  data: any;
  visible: boolean;
  color: string;
}

// 工具函数：清理GeoJSON数据，去除标记点和名称
const cleanGeoJSONData = (geojsonData: any): any => {
  if (!geojsonData || !geojsonData.features) {
    return geojsonData;
  }

  // 仅保留Polygon和MultiPolygon类型的特征
  const cleanedFeatures = geojsonData.features.filter((feature: any) => {
    return feature.geometry && 
           (feature.geometry.type === 'Polygon' || 
            feature.geometry.type === 'MultiPolygon');
  });

  // 清理每个特征的属性
  cleanedFeatures.forEach((feature: any) => {
    if (feature.properties) {
      // 移除可能导致显示标记点或名称的属性
      delete feature.properties.name;
      delete feature.properties.Name;
      delete feature.properties.NAME;
      delete feature.properties.description;
      delete feature.properties.desc;
      delete feature.properties.Description;
      delete feature.properties.icon;
      delete feature.properties.marker;
      delete feature.properties.mark;
      delete feature.properties.Mark;
      delete feature.properties.Icon;
      delete feature.properties.image;
      delete feature.properties.Image;
    }
  });

  return {
    ...geojsonData,
    features: cleanedFeatures
  };
};

function App() {
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [kecamatanError, setKecamatanError] = useState('');
  const [colorStats, setColorStats] = useState<ColorCount>({});
  const [showColorStats, setShowColorStats] = useState(false);
  const [selectedColors, setSelectedColors] = useState<ColorSelection>({});
  const [originalMarkers, setOriginalMarkers] = useState<MarkerData[]>([]);
  const [isSatelliteView, setIsSatelliteView] = useState(true);
  const [kecamatanFilter, setKecamatanFilter] = useState('');
  const [availableKecamatans, setAvailableKecamatans] = useState<string[]>([]);
  const [regionData, setRegionData] = useState<RegionGeoJSON[]>([]);
  const [showRegionBoundaries, setShowRegionBoundaries] = useState(false);
  
  // 添加数据更新检测相关状态
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);
  const [dataUpdateCount, setDataUpdateCount] = useState(0);
  
  // 验证密码 - 这里设置密码为 "omg20250501"
  const correctPassword = 'omg20250501';

  // 总部位置 - 将 6°06'45.2"S 106°55'02.3"E 转换为十进制
  const headquartersLocation = {
    lat: -(6 + 6/60 + 45.2/3600), // 南纬转为负值
    lng: 106 + 55/60 + 2.3/3600
  };

  // 使用总部位置作为地图中心
  const center = headquartersLocation;
  
  // 缩放级别设置
  const zoom = 14; // 调整缩放级别以更好地显示总部周边
  const maxZoom = 19; // 瓦片服务的最大缩放级别
  
  // 加载可用区域名称
  useEffect(() => {
    // 从GitHub仓库读取区域数据
    const githubUrl = 'https://raw.githubusercontent.com/AlimanIrawan/indonesia-map-app/main/public/markers.csv';
    
    console.log('🌐 从GitHub仓库加载区域名称...');
    
    fetch(githubUrl, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`GitHub仓库响应错误: ${response.status}`);
        }
        console.log('✅ 成功从GitHub仓库获取区域数据');
        return response.text();
      })
      .then(csvText => {
        const lines = csvText.split('\n');
        const kecamatans = new Set<string>();
        
        // 解析CSV获取所有区域名称
        lines.slice(1)
          .filter(line => line.trim() !== '')
          .forEach(line => {
            // 使用更健壮的CSV解析逻辑，处理带引号的字段
            const fields = line.split(',');
            
            // CSV格式: shop_code,latitude,longitude,outlet_name,brand,kecamatan
            // 确保取出正确的kecamatan字段
            if (fields.length >= 6) {
              // 预处理CSV行，处理潜在的引号问题
              let processedLine = line;
              let inQuotes = false;
              let processedChars = [];

              // 逐字符处理，保留引号内的逗号
              for (let i = 0; i < processedLine.length; i++) {
                let char = processedLine[i];
                if (char === '"') {
                  inQuotes = !inQuotes;
                }
                if (char === ',' && inQuotes) {
                  // 在引号内的逗号替换为特殊标记
                  processedChars.push('__COMMA__');
                } else {
                  processedChars.push(char);
                }
              }
              processedLine = processedChars.join('');

              // 分割字段并还原特殊标记
              const properFields = processedLine.split(',').map(field => 
                field.replace(/__COMMA__/g, ',').replace(/^"(.+)"$/, '$1').trim()
              );
              
              const kecamatan = properFields[5]?.trim();
              if (kecamatan) {
                kecamatans.add(kecamatan);
              }
            }
          });
          
        // 添加"One Meter"作为特殊选项
        kecamatans.add("One Meter");
        
        // 排序并设置可用区域
        setAvailableKecamatans(Array.from(kecamatans).sort());
        console.log(`✅ 成功加载 ${kecamatans.size} 个区域名称`);
      })
      .catch(err => {
        console.error('从GitHub仓库加载区域数据出错:', err);
        // 如果失败，至少提供"One Meter"选项
        setAvailableKecamatans(["One Meter"]);
      });
  }, []);

  // 验证区域名称是否有效
  const isValidKecamatan = (kecamatan: string): boolean => {
    // "One Meter"始终是有效的
    if (kecamatan === "One Meter") return true;
    
    // 检查是否在可用区域列表中
    return availableKecamatans.includes(kecamatan);
  };

  // 验证密码并加载数据
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 重置错误信息
    setPasswordError('');
    setKecamatanError('');
    
    // 检查区域名称是否填写
    const trimmedKecamatan = kecamatanFilter.trim();
    if (!trimmedKecamatan) {
      setKecamatanError('请输入区域名称');
      return;
    }
    
    // 验证区域名称是否有效
    if (!isValidKecamatan(trimmedKecamatan)) {
      setKecamatanError('无效的区域名称，该区域不存在');
      return;
    }
    
    // 验证密码
    if (password === correctPassword) {
      // 使用筛选值加载数据
      loadMarkerData(trimmedKecamatan);
      setIsAuthenticated(true);
    } else {
      setPasswordError('密码错误，请重试');
    }
  };

  // 更新统计数据
  const updateStatistics = useCallback((filteredMarkers: MarkerData[]) => {
    const brandStats: { [key: string]: number } = {};
    const multiBrandCount = filteredMarkers.filter(m => m.isMultiBrand).length;
    
    // 统计品牌数量
    filteredMarkers.forEach(marker => {
      if (marker.isMultiBrand) {
        // 多品牌位置：每个品牌都计数
        marker.brand.forEach(brand => {
          brandStats[brand] = (brandStats[brand] || 0) + 1;
        });
      } else {
        // 单品牌位置
        brandStats[marker.brand[0]] = (brandStats[marker.brand[0]] || 0) + 1;
      }
    });

    // 添加多品牌位置的统计
    if (multiBrandCount > 0) {
      brandStats['Multi-brand'] = multiBrandCount;
    }

    // 初始化选择状态，但保留现有的选择状态
    const initialSelection: ColorSelection = {};
    Object.keys(brandStats).forEach(brand => {
      // 如果已经存在于selectedColors中，保持其状态；否则设为true
      initialSelection[brand] = selectedColors.hasOwnProperty(brand) 
        ? selectedColors[brand] 
        : true;
    });
    
    // 确保"Potential"选项存在
    initialSelection['Potential'] = selectedColors.hasOwnProperty('Potential')
      ? selectedColors['Potential']
      : true;
    
    setColorStats(brandStats);
    
    // 只在初始加载时设置选中状态，而不是每次更新都重置
    if (Object.keys(selectedColors).length === 0) {
      setSelectedColors(initialSelection);
    }
  }, [selectedColors]);

  // 加载标记点数据的函数 - 使用useCallback避免useEffect依赖警告
  const loadMarkerData = useCallback((kecamatanValue: string) => {
    setIsLoading(true);
    
    // 直接从GitHub仓库读取CSV数据
    const githubUrl = 'https://raw.githubusercontent.com/AlimanIrawan/indonesia-map-app/main/public/markers.csv';
    
    console.log('🌐 从GitHub仓库获取数据...');
    
    // 从GitHub获取数据
    fetch(githubUrl, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`GitHub数据访问失败: ${response.status}`);
        }
        console.log('✅ 成功从GitHub获取数据');
        
        // 记录文件的最后修改时间
        const lastModified = response.headers.get('Last-Modified');
        if (lastModified) {
          setLastUpdateTime(new Date(lastModified).getTime());
        } else {
          setLastUpdateTime(Date.now());
        }
        
        return response.text();
      })
      .then(csvText => {
        console.log('📊 GitHub CSV数据:', csvText.substring(0, 200) + '...');
        
        const lines = csvText.split('\n');
        const multiBrandLocations: string[][] = [];
        
        // 解析标记点数据
        const parsedMarkers: MarkerData[] = lines.slice(1)
          .filter(line => line.trim() !== '')
          .map(line => {
            // 使用更健壮的CSV解析逻辑，处理带引号的字段

            // 预处理CSV行，处理潜在的引号问题
            let processedLine = line;
            let inQuotes = false;
            let processedChars = [];

            // 逐字符处理，保留引号内的逗号
            for (let i = 0; i < processedLine.length; i++) {
              let char = processedLine[i];
              if (char === '"') {
                inQuotes = !inQuotes;
              }
              if (char === ',' && inQuotes) {
                // 在引号内的逗号替换为特殊标记
                processedChars.push('__COMMA__');
              } else {
                processedChars.push(char);
              }
            }
            processedLine = processedChars.join('');

            // 分割字段并还原特殊标记
            const fields = processedLine.split(',').map(field => 
              field.replace(/__COMMA__/g, ',').replace(/^"(.+)"$/, '$1').trim()
            );

            const [rawShopCode, latitude, longitude, outletName, brandField, kecamatan, potensi] = fields;
            
            // 调试输出
            console.log("原始CSV中的shop_code:", rawShopCode);

            // 确保shop_code是完整的字符串，扩展到12位
            const shopCode = rawShopCode ? ensureShopCodeLength(rawShopCode.trim()) : '';
            
            // 调试输出处理后的shop_code
            console.log("处理后的shop_code:", shopCode);

            // 处理多品牌情况
            const brandsText = brandField || '';
            // 分割品牌，保留原始大小写，移除前后空格
            const brands = brandsText
              .split(/\s*,\s*/)
              .map(b => b.trim())
              .filter(b => b !== '');

            const isMultiBrand = brands.length > 1;
            
            // 如果是多品牌位置，记录品牌组合
            if (isMultiBrand) {
              multiBrandLocations.push(brands);
            }
            
            // 检查字段有效性
            if (isNaN(parseFloat(latitude)) || isNaN(parseFloat(longitude))) {
              console.warn(`跳过无效坐标: ${latitude}, ${longitude}`);
              return null;
            }
            
            return {
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
              outletName: outletName || '未命名位置',
              brand: brands,
              displayBrand: isMultiBrand ? 'Multi-brand' : brands[0],
              isMultiBrand,
              shopCode: shopCode,
              kecamatan: kecamatan || '',
              isPotential: potensi.toLowerCase().trim() === 'potensi' // 如果potensi列为"potensi"则设为true
            };
          })
          // 一次性过滤掉null值和无效坐标
          .filter((marker): marker is MarkerData => 
            marker !== null && 
            !isNaN(marker.latitude) && 
            !isNaN(marker.longitude)
          );

        console.log(`✅ 成功解析 ${parsedMarkers.length} 条数据记录`);

        // 保存所有标记点数据
        setOriginalMarkers(parsedMarkers);
        
        // 根据kecamatanValue筛选数据
        let filteredMarkers = parsedMarkers;
        if (kecamatanValue && kecamatanValue !== 'One Meter') {
          filteredMarkers = parsedMarkers.filter(marker => 
            marker.kecamatan.toLowerCase() === kecamatanValue.toLowerCase()
          );
        }
        
        // 根据筛选后的数据计算统计
        setSelectedColors({}); // 清空旧的选择状态
        updateStatistics(filteredMarkers);
        
        setMarkers(filteredMarkers);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('从GitHub加载数据出错:', err);
        setError(`无法从GitHub加载数据: ${err.message}`);
        setIsLoading(false);
        
        // 显示错误提示
        const errorNotification = document.createElement('div');
        errorNotification.textContent = `数据加载失败: ${err.message}`;
        errorNotification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #f44336;
          color: white;
          padding: 10px 20px;
          border-radius: 5px;
          z-index: 10000;
          font-size: 14px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(errorNotification);
        
        // 5秒后移除提示
        setTimeout(() => {
          if (document.body.contains(errorNotification)) {
            document.body.removeChild(errorNotification);
          }
        }, 5000);
      });
  }, [updateStatistics]);

  // 全选逻辑
  const selectAllColors = () => {
    const newSelections = { ...selectedColors };
    Object.keys(colorStats).forEach(brand => {
      newSelections[brand] = true;
    });
    // 确保"Potential"选项也被选中
    newSelections['Potential'] = true;
    setSelectedColors(newSelections);
    filterMarkers(newSelections, false);
  };

  // 取消全选逻辑
  const deselectAllColors = () => {
    const newSelections = { ...selectedColors };
    Object.keys(colorStats).forEach(brand => {
      newSelections[brand] = false;
    });
    // 确保"Potential"选项也被取消选中
    newSelections['Potential'] = false;
    setSelectedColors(newSelections);
    filterMarkers(newSelections, false);
  };

  // 切换单个颜色
  const toggleColor = (brand: string) => {
    const newSelections = {
      ...selectedColors,
      [brand]: !selectedColors[brand]
    };
    setSelectedColors(newSelections);
    filterMarkers(newSelections, false);
  };

  // 更新筛选逻辑
  const filterMarkers = (selections: ColorSelection, updateStats: boolean = true) => {
    const filteredMarkers = originalMarkers.filter(marker => {
      // 首先检查kecamatan筛选
      if (kecamatanFilter && kecamatanFilter !== 'One Meter' && 
          marker.kecamatan.toLowerCase() !== kecamatanFilter.toLowerCase()) {
        return false;
      }
      
      // 检查是否显示有潜力店铺
      if (selections['Potential'] && marker.isPotential) {
        return true;
      }
      
      // 然后检查品牌筛选
      if (marker.isMultiBrand) {
        // 多品牌位置的显示逻辑：
        // 1. 如果选中了"Multi-brand"，显示
        // 2. 或者如果选中了该位置的任何一个品牌，也显示
        return selections['Multi-brand'] || 
               marker.brand.some(brand => selections[brand]);
      } else {
        // 单品牌位置：只要该品牌被选中就显示
        return selections[marker.brand[0]];
      }
    });
    
    // 更新标记点
    setMarkers(filteredMarkers);
    
    // 只在需要时更新统计数据
    if (updateStats) {
      updateStatistics(filteredMarkers);
    }
  };

  // 渲染统计面板 - 完全重写此函数
  const renderColorStats = () => {
    if (!colorStats) return null;
    
    // 分离常规品牌和特殊品牌
    const regularBrands: [string, number][] = [];
    const specialBrands: [string, number][] = [];
    
    Object.entries(colorStats).forEach(([brand, count]) => {
      if (REGULAR_BRANDS.includes(brand)) {
        regularBrands.push([brand, count]);
      } else if (SPECIAL_BRANDS.includes(brand)) {
        specialBrands.push([brand, count]);
      } else {
        // 如果发现未定义的品牌，添加到常规品牌中
        regularBrands.push([brand, count]);
      }
    });
    
    // 对常规品牌按数量排序
    regularBrands.sort(([, countA], [, countB]) => countB - countA);
    
    // 计算常规品牌的总和
    const regularTotal = regularBrands.reduce((sum, [, count]) => sum + count, 0);
    
    return (
      <div className="color-stats-panel">
        <div className="color-stats-header">
          <h3>终端统计</h3>
          <button onClick={() => setShowColorStats(false)}>×</button>
        </div>
        
        <div className="color-filter-actions">
          <button className="color-filter-action" onClick={selectAllColors}>全选</button>
          <button className="color-filter-action" onClick={deselectAllColors}>取消全选</button>
        </div>
        
        <div className="color-stats-list">
          {/* 当前筛选条件标注 */}
          {kecamatanFilter && kecamatanFilter !== 'One Meter' && (
            <div className="current-filter">
              当前区域: {kecamatanFilter}
            </div>
          )}
          
          {/* 常规品牌部分 */}
          {regularBrands.map(([brand, count]) => (
            <div key={brand} className="color-stat-item">
              <label>
                <input
                  type="checkbox"
                  checked={selectedColors[brand] || false}
                  onChange={() => toggleColor(brand)}
                />
                <span className="color-dot" style={{ backgroundColor: BRAND_COLORS[brand] }}></span>
                <span className="brand-name">{brand}</span>
                <span className="brand-count">{count}</span>
              </label>
            </div>
          ))}
          
          {/* 常规品牌总计 */}
          <div className="stats-total">
            总计 {regularTotal} 台冰柜
          </div>
          
          {/* 明确的分隔线 */}
          <div className="stats-divider"></div>
          
          {/* 特殊品牌部分 */}
          {/* 有潜力店铺选项 */}
          <div className="color-stat-item special-brand-item">
            <label>
              <input
                type="checkbox"
                checked={selectedColors['Potential'] || false}
                onChange={() => toggleColor('Potential')}
              />
              <span className="color-dot" style={{ backgroundColor: '#fff', border: '2px solid #FFD700' }}></span>
              <span className="brand-name">有潜力店铺</span>
              <span className="brand-count">
                {originalMarkers.filter(m => m.isPotential && 
                  (kecamatanFilter === 'One Meter' || m.kecamatan.toLowerCase() === kecamatanFilter.toLowerCase())).length}
              </span>
            </label>
          </div>
          
          {specialBrands.map(([brand, count]) => (
            <div key={brand} className="color-stat-item special-brand-item">
              <label>
                <input
                  type="checkbox"
                  checked={selectedColors[brand] || false}
                  onChange={() => toggleColor(brand)}
                />
                <span className="color-dot" style={{ backgroundColor: BRAND_COLORS[brand] }}></span>
                <span className="brand-name">{brand === 'Multi-brand' ? '多品牌位置' : brand}</span>
                <span className="brand-count">{count}</span>
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // 加载区域GeoJSON数据
  useEffect(() => {
    // 只有在用户通过验证后才加载区域数据
    if (isAuthenticated) {
      setIsLoading(true);
      
      // 从服务器获取区域文件列表
      fetch(`${window.location.origin}/geojson/regions-list.json?t=${new Date().getTime()}`)
        .then(response => {
          if (!response.ok) {
            // 如果列表文件不存在，就不显示错误，而是假设没有区域文件
            if (response.status === 404) {
              return Promise.resolve('{"regions": []}');
            }
            throw new Error('无法加载区域列表');
          }
          return response.text();
        })
        .then(text => {
          // 尝试解析JSON，添加错误处理
          let data;
          try {
            data = JSON.parse(text);
            
            // 验证regions是否是数组
            if (!Array.isArray(data.regions)) {
              console.error('regions-list.json格式错误: regions不是数组');
              data = { regions: [] };
            }
          } catch (error) {
            console.error('regions-list.json解析错误:', error);
            // 如果解析失败，使用空数组
            data = { regions: [] };
          }
          
          const regionList = data.regions || [];
          
          // 确保所有区域都是字符串类型
          const validRegionList = regionList.filter((region: any): region is string => typeof region === 'string');
          
          // 如果没有区域文件，就结束加载
          if (validRegionList.length === 0) {
            setIsLoading(false);
            return;
          }
          
          // 加载每个区域的GeoJSON数据
          const promises = validRegionList.map((region: string) => {
            return fetch(`${window.location.origin}/geojson/${region}.geojson?t=${new Date().getTime()}`)
              .then(response => {
                if (!response.ok) {
                  throw new Error(`无法加载区域 ${region} 的GeoJSON数据`);
                }
                return response.json();
              })
              .then(geojsonData => {
                // 过滤GeoJSON数据，移除标记点和名称
                const cleanedData = cleanGeoJSONData(geojsonData);
                
                return {
                  name: region,
                  data: cleanedData,
                  visible: true,
                  color: '#007BFF' // 从橙色(#FF8C00)改为蓝色(#007BFF)
                };
              })
              .catch(err => {
                console.error(`加载区域 ${region} 出错:`, err);
                return null;
              });
          });
          
          // 等待所有区域数据加载完成
          Promise.all(promises)
            .then(results => {
              // 过滤掉加载失败的区域
              const validRegions = results.filter(region => region !== null) as RegionGeoJSON[];
              setRegionData(validRegions);
              setIsLoading(false);
            })
            .catch(err => {
              console.error('加载区域数据出错:', err);
              setIsLoading(false);
            });
        })
        .catch(err => {
          console.error('加载区域列表出错:', err);
          setIsLoading(false);
        });
    }
  }, [isAuthenticated]);

  // 切换单个区域的显示状态
  const toggleRegionVisibility = (regionName: string) => {
    setRegionData(prevRegions => 
      prevRegions.map(region => 
        region.name === regionName 
          ? { ...region, visible: !region.visible } 
          : region
      )
    );
  };

  // 切换所有区域的显示状态
  const toggleAllRegionsVisibility = () => {
    const allHidden = regionData.every(region => !region.visible);
    setRegionData(prevRegions => 
      prevRegions.map(region => ({ ...region, visible: allHidden }))
    );
  };

  // 渲染区域设置面板
  const renderRegionSettings = () => {
    console.log("渲染区域设置面板", regionData.length, showRegionBoundaries);
    
    // 如果没有区域数据，返回空
    if (regionData.length === 0) {
      console.log("没有区域数据");
      return null;
    }
    
    return (
      <div className="region-settings-panel">
        <div className="region-settings-header">
          <h3>区域边界设置</h3>
          <button onClick={() => setShowRegionBoundaries(false)}>×</button>
        </div>
        
        <div className="region-filter-actions">
          <button className="region-filter-action" onClick={toggleAllRegionsVisibility}>
            {regionData.every(region => !region.visible) ? '全部显示' : '全部隐藏'}
          </button>
        </div>
        
        <div className="region-settings-list">
          {regionData
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((region: RegionGeoJSON) => (
              <div key={region.name} className="region-setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={region.visible}
                    onChange={() => toggleRegionVisibility(region.name)}
                  />
                  <span className="region-name">{region.name}</span>
                </label>
              </div>
            ))}
        </div>
      </div>
    );
  };

  // 添加缺失的useEffect用于数据更新检查
  useEffect(() => {
    if (!isAuthenticated || !isAutoRefreshEnabled) return;

    const checkForUpdates = async () => {
      try {
        // 从GitHub仓库检查更新
        const githubUrl = 'https://raw.githubusercontent.com/AlimanIrawan/indonesia-map-app/main/public/markers.csv';
        
        console.log('🔍 检查GitHub仓库数据更新...');
        
        const response = await fetch(githubUrl, {
          method: 'HEAD',
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.ok) {
          const lastModified = response.headers.get('Last-Modified');
          if (lastModified) {
            const fileTime = new Date(lastModified).getTime();
            
            // 如果文件时间比上次记录的时间新，则重新加载数据
            if (lastUpdateTime > 0 && fileTime > lastUpdateTime) {
              console.log('🔄 检测到GitHub仓库数据更新，正在重新加载...');
              setDataUpdateCount(prev => prev + 1);
              
              // 显示更新提示
              const updateNotification = document.createElement('div');
              updateNotification.textContent = '检测到新数据（GitHub仓库），正在更新地图...';
              updateNotification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                z-index: 10000;
                font-size: 14px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
              `;
              document.body.appendChild(updateNotification);
              
              // 重新加载数据
              loadMarkerData(kecamatanFilter);
              
              // 3秒后移除提示
              setTimeout(() => {
                if (document.body.contains(updateNotification)) {
                  document.body.removeChild(updateNotification);
                }
              }, 3000);
            }
            
            // 更新最后检查时间
            setLastUpdateTime(fileTime);
          }
        }
      } catch (error) {
        console.error('检查GitHub仓库更新失败:', error);
      }
    };

    // 每30秒检查一次数据更新
    const interval = setInterval(checkForUpdates, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, kecamatanFilter, lastUpdateTime, isAutoRefreshEnabled, loadMarkerData]);

  // 显示错误信息
  if (error) {
    return <div className="error">{error}</div>;
  }

  // 渲染登录界面
  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="logo-container">
            <img src={logoBase64} alt="印尼地图标注系统" className="logo-image" />
          </div>
          <h2>印尼地图标注系统</h2>
          <p>请输入账号和密码查看地图数据</p>
          
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <input
                type="text"
                id="username" 
                name="username"
                value={kecamatanFilter}
                onChange={(e) => setKecamatanFilter(e.target.value)}
                placeholder="区域名称 (必填)"
                className="username-input"
                autoComplete="username"
              />
              {kecamatanError && <div className="kecamatan-error">{kecamatanError}</div>}
            </div>
            
            <div className="form-group">
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="password-input"
                placeholder="请输入访问密码"
                autoComplete="current-password"
              />
              {passwordError && <div className="password-error">{passwordError}</div>}
            </div>
            
            <button type="submit" className="login-button">登录</button>
          </form>
        </div>
      </div>
    );
  }

  // 渲染地图界面
  return (
    <div className="App">
      <div className="map-container">
        <MapContainer 
          center={[center.lat, center.lng]} 
          zoom={zoom} 
          zoomControl={false}
          style={{ height: '100vh', width: '100%' }}
          maxZoom={maxZoom}
          preferCanvas={true}
        >
          {/* 自定义控制面板 */}
          <div className="control-panel">
            <div className="button-group">
              {/* 统计按钮 */}
              <button 
                className="control-button stats-button" 
                onClick={() => setShowColorStats(!showColorStats)}
                title="标记点统计"
              >
                📊
              </button>

              {/* 图层切换按钮 */}
              <button 
                className="control-button layers-button" 
                onClick={() => setIsSatelliteView(!isSatelliteView)}
                title={isSatelliteView ? "切换到普通地图" : "切换到卫星图"}
              >
                {isSatelliteView ? "🗺️" : "🛰️"}
              </button>

              {/* 自动刷新控制按钮 */}
              <button 
                className={`control-button refresh-button ${isAutoRefreshEnabled ? 'active' : 'inactive'}`}
                onClick={() => setIsAutoRefreshEnabled(!isAutoRefreshEnabled)}
                title={`数据自动刷新: ${isAutoRefreshEnabled ? '开启' : '关闭'}${dataUpdateCount > 0 ? ` (已更新${dataUpdateCount}次)` : ''}`}
              >
                {isAutoRefreshEnabled ? '🔄' : '⏸️'}
                {dataUpdateCount > 0 && (
                  <span className="update-badge">{dataUpdateCount}</span>
                )}
              </button>

              {/* 定位按钮 */}
              <LocationMarker />
            </div>

            {/* 调用优化的统计面板渲染函数 */}
            {showColorStats && renderColorStats()}
            
            {/* 区域设置面板（移到这里） */}
            {showRegionBoundaries && renderRegionSettings()}
          </div>
          
          {/* 地图图层 */}
          {isSatelliteView ? (
            <TileLayer
              attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              noWrap={true}
              maxZoom={maxZoom}
            />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={maxZoom}
            />
          )}

          {/* 区域边界图层 */}
          {regionData.map((region: RegionGeoJSON) => (
            region.visible && (
              <GeoJSON 
                key={region.name}
                data={region.data}
                style={() => ({
                  color: '#007BFF',
                  weight: 3,
                  opacity: 0.8,
                  fillOpacity: 0,
                  interactive: false
                })}
              />
            )
          ))}

          {/* 标记点 */}
          {markers.map((marker, index) => (
            <CircleMarker
              key={index}
              center={[marker.latitude, marker.longitude]}
              radius={8}
              pathOptions={{
                fillColor: getMarkerColor(marker.displayBrand),
                fillOpacity: 1,
                weight: 3,
                color: marker.isPotential ? '#FFD700' : '#fff', // 金色边框表示有潜力店铺
                opacity: 1
              }}
              className={marker.isPotential ? 'potential-marker' : ''}
              eventHandlers={{
                click: (e) => {
                  e.originalEvent.stopPropagation();
                }
              }}
            >
              <Popup 
                offset={[0, -10]} 
                autoPan={true} 
                closeButton={true}
                className="marker-custom-popup"
              >
                <div className="marker-popup">
                  <h3>{marker.outletName}</h3>
                  {marker.isPotential && (
                    <p className="potential-label">⭐ 有潜力店铺 ⭐</p>
                  )}
                  {marker.shopCode && (
                    <>
                      {/* 调试输出: 显示完整的shopCode */}
                      <div style={{display: 'none'}}>完整shop_code: {marker.shopCode}</div>
                      <div className="shop-code-container">
                        <span className="shop-code">#{marker.shopCode}</span>
                        <button 
                          className="copy-button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            // 只复制数字部分，移除#号
                            const codeToClip = marker.shopCode;
                            
                            // 添加按钮状态变化
                            const button = e.currentTarget;
                            button.classList.add('copied');
                            button.textContent = '✓';
                            
                            navigator.clipboard.writeText(codeToClip)
                              .then(() => {
                                // 显示复制成功提示
                                const popup = document.createElement('div');
                                popup.className = 'copy-success';
                                popup.textContent = '已复制';
                                document.body.appendChild(popup);
                                
                                // 1.5秒后移除提示和恢复按钮状态
                                setTimeout(() => {
                                  document.body.removeChild(popup);
                                  button.classList.remove('copied');
                                  button.textContent = '📋';
                                }, 1500);
                              })
                              .catch(err => {
                                console.error('复制失败:', err);
                                // 复制失败时也恢复按钮状态
                                button.classList.remove('copied');
                                button.textContent = '📋';
                              });
                          }}
                          title="复制编号"
                        >
                          📋
                        </button>
                      </div>
                    </>
                  )}
                  <p>{marker.brand.join(', ')}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* 总部标记 */}
          <Marker 
            position={[headquartersLocation.lat, headquartersLocation.lng]}
            icon={new L.DivIcon({
              className: 'custom-div-icon',
              html: `
                <div style="position: relative; width: 30px; height: 30px; z-index: 2000;">
                  <svg width="30" height="30" viewBox="0 0 24 24">
                    <path d="M12 0 L15.5 8.5 L24 9.9 L18 16.5 L19.5 24 L12 20.5 L4.5 24 L6 16.5 L0 9.9 L8.5 8.5 Z" 
                          fill="#FF2D00" stroke="#000" stroke-width="1" />
                  </svg>
                </div>
              `,
              iconSize: [30, 30],
              iconAnchor: [15, 15]
            })}
            zIndexOffset={2000}
            interactive={false}
          >
            <Popup>
              <div className="marker-popup">
                <h3>总部</h3>
                <p>地址: 6°06'45.2"S 106°55'02.3"E</p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
      
      {isLoading && <div className="loading-overlay">数据加载中...</div>}
    </div>
  );
}

export default App;
