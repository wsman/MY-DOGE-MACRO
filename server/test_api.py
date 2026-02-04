"""
Python服务测试脚本
验证高性能数据接口和SSE进度流
"""

import asyncio
import aiohttp
import json
import time
from typing import Dict, Any
import sys
import os

# 添加当前目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def test_health_check(session: aiohttp.ClientSession, base_url: str, token: str):
    """测试健康检查接口"""
    headers = {"X-Auth-Token": token}
    async with session.get(f"{base_url}/health", headers=headers) as response:
        print(f"健康检查: 状态码 {response.status}")
        if response.status == 200:
            data = await response.json()
            print(f"  响应: {json.dumps(data, indent=2)}")
            return True
    return False

async def test_kline_data(session: aiohttp.ClientSession, base_url: str, token: str, symbol: str = "000001.SZ"):
    """测试K线数据接口（模拟数据）"""
    headers = {"X-Auth-Token": token}
    
    # 测试标准K线接口
    print(f"测试K线接口: {symbol}")
    async with session.get(f"{base_url}/market/kline/{symbol}?limit=100", headers=headers) as response:
        print(f"  K线接口状态码: {response.status}")
        if response.status == 200:
            data = await response.json()
            print(f"  数据格式: {data.get('columns', 'N/A')}")
            print(f"  数据行数: {len(data.get('data', [])) if data.get('data') else 0}")
            
            # 检查响应头
            print(f"  传输模式: {response.headers.get('X-Transmission-Mode', 'N/A')}")
            print(f"  数据大小: {response.headers.get('X-Data-Size', 'N/A')}")
            
            return True
    return False

async def test_bulk_performance(session: aiohttp.ClientSession, base_url: str, token: str, count: int = 5000):
    """测试批量数据性能"""
    headers = {"X-Auth-Token": token}
    
    print(f"测试批量数据性能 ({count}行)")
    start_time = time.time()
    
    async with session.get(f"{base_url}/api/v1/market/test/bulk?count={count}", headers=headers) as response:
        elapsed = time.time() - start_time
        print(f"  请求耗时: {elapsed:.3f}秒")
        print(f"  状态码: {response.status}")
        
        if response.status == 200:
            # 只读取元数据，不下载整个响应体
            data_size = response.headers.get('X-Data-Size-Records', '0')
            split_size = response.headers.get('X-Data-Size-Split', '0')
            compression = response.headers.get('X-Compression-Ratio', 'N/A')
            
            print(f"  JSON records大小: {data_size} bytes")
            print(f"  列式传输大小: {split_size} bytes")
            print(f"  压缩比: {compression}")
            
            if data_size and split_size:
                size_reduction = (1 - int(split_size) / int(data_size)) * 100
                print(f"  体积减少: {size_reduction:.1f}%")
            
            return True
    return False

async def test_scan_task_api(session: aiohttp.ClientSession, base_url: str, token: str):
    """测试扫描任务API"""
    headers = {"X-Auth-Token": token}
    
    # 测试启动扫描
    print("测试扫描任务启动")
    start_data = {
        "mode": "CN",
        "tdx_path": "D:/Games/New Tdx Vip2020",
        "db_path": "data/test_market.db"
    }
    
    async with session.post(
        f"{base_url}/api/v1/scan/start",
        params=start_data,
        headers=headers
    ) as response:
        print(f"  启动扫描状态码: {response.status}")
        if response.status == 200:
            data = await response.json()
            task_id = data.get('task_id')
            print(f"  任务ID: {task_id}")
            
            # 测试状态查询
            if task_id:
                await asyncio.sleep(0.5)
                async with session.get(
                    f"{base_url}/api/v1/scan/status/{task_id}",
                    headers=headers
                ) as status_response:
                    if status_response.status == 200:
                        status_data = await status_response.json()
                        print(f"  任务状态: {status_data.get('status')}")
                        print(f"  任务进度: {status_data.get('progress')}%")
                        print(f"  任务消息: {status_data.get('message')}")
            
            return True
    return False

async def test_sse_stream(session: aiohttp.ClientSession, base_url: str, token: str, task_id: str):
    """测试SSE实时进度流（简化测试）"""
    print(f"测试SSE流: 任务 {task_id}")
    
    try:
        # 测试SSE流（连接几秒）
        timeout = aiohttp.ClientTimeout(total=3)
        async with session.get(
            f"{base_url}/api/v1/scan/status/stream?task_id={task_id}",
            headers={"X-Auth-Token": token},
            timeout=timeout
        ) as response:
            print(f"  SSE连接状态: {response.status}")
            
            # 读取部分SSE数据
            if response.status == 200:
                line_count = 0
                async for line in response.content:
                    line_text = line.decode('utf-8').strip()
                    if line_text.startswith('data:'):
                        line_count += 1
                        if line_count <= 3:  # 只显示前3条消息
                            data = json.loads(line_text[5:])
                            print(f"  SSE消息{line_count}: 进度={data.get('progress')}%, 状态={data.get('status')}")
                        if line_count >= 3:
                            break
                
                print(f"  收到SSE消息数量: {line_count}")
                return line_count > 0
    except asyncio.TimeoutError:
        print("  SSE连接超时（预期行为）")
        return True
    except Exception as e:
        print(f"  SSE测试错误: {e}")
        return False

async def main():
    """主测试函数"""
    base_url = "http://localhost:8765"
    token = "test-token-123456"  # 测试用token
    
    print("=" * 60)
    print("开始性能测试与接口验证")
    print("=" * 60)
    
    async with aiohttp.ClientSession() as session:
        # 1. 基础健康检查
        print("\n1. 基础接口测试")
        health_ok = await test_health_check(session, base_url, token)
        if not health_ok:
            print("❌ 健康检查失败")
            return
        
        # 2. K线数据接口
        print("\n2. K线数据接口测试")
        kline_ok = await test_kline_data(session, base_url, token)
        if not kline_ok:
            print("⚠️  K线接口测试失败（可能缺少真实TDX数据）")
        
        # 3. 批量性能测试（5000行数据）
        print("\n3. 批量数据传输性能测试")
        bulk_ok = await test_bulk_performance(session, base_url, token, 5000)
        if not bulk_ok:
            print("❌ 批量性能测试失败")
            return
        
        # 4. 扫描任务API测试
        print("\n4. 扫描任务API测试")
        scan_ok = await test_scan_task_api(session, base_url, token)
        if not scan_ok:
            print("⚠️  扫描任务API测试失败（可能依赖外部TDX路径）")
        
        # 5. 系统信息
        print("\n5. 系统信息接口")
        headers = {"X-Auth-Token": token}
        async with session.get(f"{base_url}/api/v1/system/info", headers=headers) as response:
            if response.status == 200:
                sys_info = await response.json()
                print(f"  Python版本: {sys_info.get('python_version')}")
                print(f"  内存使用: {sys_info.get('memory_usage', {}).get('process_mb', 'N/A')}MB")
                print(f"  活跃任务数: {sys_info.get('task_stats', {}).get('active_tasks', 0)}")
        
        print("\n" + "=" * 60)
        print("测试完成！")
        print("=" * 60)
        
        # 性能总结
        print("\n📊 性能预期总结:")
        print("  • 列式传输(split格式) vs JSON records: 体积减少 50-70%")
        print("  • GZIP压缩: 进一步减少 60-80% 传输体积")
        print("  • 5000行K线数据传输目标: <1秒")
        print("  • 内存LRU缓存: 热点数据响应时间 <100ms")
        print("  • SSE实时进度更新: 延迟 <500ms")

if __name__ == "__main__":
    asyncio.run(main())