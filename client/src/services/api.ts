import axios, { AxiosInstance } from 'axios';

// 定义配置接口
interface PythonConfig {
  port: number;
  token: string;
}

// 🚫 硬编码配置 (仅用于纯 Web 开发模式调试)
// 注意：这必须与您手动启动的 Python 服务参数一致
const DEV_CONFIG: PythonConfig = {
  port: 8766, 
  token: "mydoge-token-123456", // 对应您手动启动 python server 时用的 token
};

class ApiService {
  private client: AxiosInstance | null = null;
  private config: PythonConfig | null = null;
  private initPromise: Promise<AxiosInstance> | null = null;

  // 核心：环境检测
  private isTauri(): boolean {
    return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  }

  // 单例初始化模式
  public async getClient(): Promise<AxiosInstance> {
    if (this.client) return this.client;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.initialize();
    return this.initPromise;
  }

  private async initialize(): Promise<AxiosInstance> {
    try {
      if (this.isTauri()) {
        console.log('🚀 检测到 Tauri 环境，尝试握手...');
        // 动态导入避免 Web 环境报错
        const { invoke } = await import('@tauri-apps/api/core');
        this.config = await invoke<PythonConfig>('get_python_config');
        console.log('✅ 握手成功 (Tauri Mode):', this.config);
      } else {
        console.warn('⚠️ 检测到 Web 环境，使用开发配置 (Dev Mode)...');
        // Web 模式直接使用硬编码配置
        this.config = DEV_CONFIG;
      }

      // 创建 Axios 实例
      this.client = axios.create({
        baseURL: `http://localhost:${this.config.port}`,
        headers: {
          'x-auth-token': this.config.token,
          'Content-Type': 'application/json',
          'X-Client': 'my-doge-tauri',
        },
        timeout: 30000,
        validateStatus: (status) => status >= 200 && status < 500,
      });

      // 添加请求拦截器（自动注入Token）
      this.client.interceptors.request.use(
        (config) => {
          // 确保头部存在
          if (this.config && !config.headers['x-auth-token']) {
            config.headers['x-auth-token'] = this.config.token;
          }
          
          // 添加请求时间戳用于调试
          config.headers['X-Request-Timestamp'] = Date.now().toString();
          
          return config;
        },
        (error) => {
          console.error('❌ 请求拦截器错误:', error);
          return Promise.reject(error);
        }
      );

      // 添加响应拦截器（统一错误处理）
      this.client.interceptors.response.use(
        (response) => {
          // 记录响应时间
          const requestTime = response.config.headers['X-Request-Timestamp'];
          if (requestTime) {
            const latency = Date.now() - parseInt(requestTime);
            console.log(`📡 ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${latency}ms)`);
          }
          
          return response;
        },
        (error) => {
          // 处理网络错误
          if (!error.response) {
            console.error('🌐 网络错误:', error.message);
            return Promise.reject(new Error('网络连接失败，请检查Python服务是否运行'));
          }

          // 处理认证错误（401）
          if (error.response.status === 401) {
            console.error('❌ API 鉴权失败: Token 无效');
          }

          // 统一错误格式
          const apiError = {
            status: error.response?.status || 0,
            message: error.response?.data?.detail || error.message || '未知错误',
            url: error.config?.url,
            method: error.config?.method,
            timestamp: new Date().toISOString(),
          };

          console.error('❌ API错误:', apiError);
          return Promise.reject(apiError);
        }
      );

      console.log('✅ API客户端初始化完成');
      return this.client;
    } catch (error) {
      console.error('🔥 API Client 初始化严重失败:', error);
      this.initPromise = null; // 允许重试
      throw error;
    }
  }

  /**
   * 获取Python服务配置（供外部使用）
   */
  public getConfig(): PythonConfig | null {
    return this.config;
  }

  /**
   * 测试服务连通性
   */
  public async testConnection(): Promise<{ success: boolean; latency: number; message: string }> {
    const startTime = Date.now();
    try {
      const client = await this.getClient();
      const response = await client.get('/health');
      const latency = Date.now() - startTime;
      
      return {
        success: response.status === 200,
        latency,
        message: `✅ Python服务正常 (${latency}ms)`,
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        success: false,
        latency,
        message: `❌ 连接失败 (${latency}ms): ${error}`,
      };
    }
  }

  /**
   * 快捷方法：GET请求
   */
  public async get<T = any>(url: string, config?: any): Promise<T> {
    const client = await this.getClient();
    const response = await client.get<T>(url, config);
    return response.data;
  }

  /**
   * 快捷方法：POST请求
   */
  public async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const client = await this.getClient();
    const response = await client.post<T>(url, data, config);
    return response.data;
  }

  /**
   * 快捷方法：PUT请求
   */
  public async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const client = await this.getClient();
    const response = await client.put<T>(url, data, config);
    return response.data;
  }

  /**
   * 快捷方法：DELETE请求
   */
  public async delete<T = any>(url: string, config?: any): Promise<T> {
    const client = await this.getClient();
    const response = await client.delete<T>(url, config);
    return response.data;
  }
}

// 导出单例
export const apiClient = new ApiService();

// 导出类型
export type { PythonConfig };

// 市场数据API
export const marketApi = {
  // 获取股票数据
  async getQuote(ticker: string) {
    return api.get<{ ticker: string; price: number; change: number; volume: number }>(`/api/market/quote/${ticker}`);
  },
  
  // 获取K线数据
  async getHistorical(ticker: string, period: string = '1mo') {
    return api.get<any[]>(`/api/market/historical/${ticker}?period=${period}`);
  },
  
  // 搜索股票
  async search(query: string) {
    return api.get<any[]>(`/api/market/search?q=${encodeURIComponent(query)}`);
  },
  
  // 获取指数列表
  async getIndices() {
    return api.get<any[]>('/api/market/indices');
  }
};

// 分析API
export const analysisApi = {
  // 计算RSRS
  async calculateRSRS(ticker: string, period: number = 20) {
    return api.get<any>(`/api/analysis/rsrs/${ticker}?period=${period}`);
  },
  
  // 计算波动率偏度
  async calculateVolatilitySkew(ticker: string, shortPeriod: number = 5, longPeriod: number = 20) {
    return api.get<any>(`/api/analysis/volatility/${ticker}?short=${shortPeriod}&long=${longPeriod}`);
  },
  
  // 综合分析
  async analyze(ticker: string) {
    return api.get<any>(`/api/analysis/${ticker}`);
  },
  
  // 获取风险信号
  async getRiskSignals() {
    return api.get<any[]>('/api/analysis/risk-signals');
  }
};

// 报告API
export const reportApi = {
  // 生成策略报告
  async generateReport(ticker: string, context: string) {
    return api.post<any>('/api/report/generate', { ticker, context });
  },
  
  // 获取报告列表
  async getReports(limit: number = 10) {
    return api.get<any[]>(`/api/reports?limit=${limit}`);
  },
  
  // 获取单个报告
  async getReport(id: string) {
    return api.get<any>(`/api/reports/${id}`);
  }
};

// 投资组合API
export const portfolioApi = {
  // 获取持仓
  async getPositions() {
    return api.get<any[]>('/api/portfolio/positions');
  },
  
  // 添加持仓
  async addPosition(position: { ticker: string; shares: number; avgCost: number }) {
    return api.post<any>('/api/portfolio/positions', position);
  },
  
  // 获取汇总
  async getSummary() {
    return api.get<any>('/api/portfolio/summary');
  }
};

// 导出快捷方法
export const api = {
  get: async <T = any>(url: string, config?: any) => {
    const client = await apiClient.getClient();
    const response = await client.get<T>(url, config);
    return response.data;
  },
  post: async <T = any>(url: string, data?: any, config?: any) => {
    const client = await apiClient.getClient();
    const response = await client.post<T>(url, data, config);
    return response.data;
  },
  put: async <T = any>(url: string, data?: any, config?: any) => {
    const client = await apiClient.getClient();
    const response = await client.put<T>(url, data, config);
    return response.data;
  },
  delete: async <T = any>(url: string, config?: any) => {
    const client = await apiClient.getClient();
    const response = await client.delete<T>(url, config);
    return response.data;
  },
  testConnection: () => apiClient.testConnection(),
  getConfig: () => apiClient.getConfig(),
};

// 默认导出
export default apiClient;

