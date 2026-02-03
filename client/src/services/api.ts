import axios, { AxiosInstance } from 'axios';

// 定义配置接口
interface PythonConfig {
  port: number;
  token: string;
}

// FIX 1: 端口改为 8765，与后端一致
const DEV_CONFIG: PythonConfig = {
  port: 8765,  // 之前是 8766，与 server.py 默认端口对齐
  token: "mydoge-token-123456",
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
        const { invoke } = await import('@tauri-apps/api/core');
        this.config = await invoke<PythonConfig>('get_python_config');
        console.log('✅ 握手成功 (Tauri Mode):', this.config);
      } else {
        console.warn('⚠️ 检测到 Web 环境，使用开发配置 (Dev Mode)...');
        this.config = DEV_CONFIG;
      }

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

      // 请求拦截器
      this.client.interceptors.request.use(
        (config) => {
          if (this.config && !config.headers['x-auth-token']) {
            config.headers['x-auth-token'] = this.config.token;
          }
          config.headers['X-Request-Timestamp'] = Date.now().toString();
          return config;
        },
        (error) => Promise.reject(error)
      );

      // 响应拦截器
      this.client.interceptors.response.use(
        (response) => {
          const requestTime = response.config.headers['X-Request-Timestamp'];
          if (requestTime) {
            const latency = Date.now() - parseInt(requestTime);
            console.log(`📡 ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${latency}ms)`);
          }
          return response;
        },
        (error) => {
          if (!error.response) {
            console.error('🌐 网络错误:', error.message);
            return Promise.reject(new Error('网络连接失败，请检查Python服务是否运行'));
          }
          console.error(`❌ API错误 ${error.response.status}:`, error.response.data?.detail || error.message);
          return Promise.reject(error);
        }
      );

      console.log('✅ API客户端初始化完成');
      return this.client;
    } catch (error) {
      console.error('🔥 API Client 初始化失败:', error);
      this.initPromise = null;
      throw error;
    }
  }

  public getConfig(): PythonConfig | null {
    return this.config;
  }

  public async testConnection(): Promise<{ success: boolean; latency: number; message: string }> {
    const startTime = Date.now();
    try {
      const client = await this.getClient();
      const response = await client.get('/health');
      const latency = Date.now() - startTime;
      return { success: response.status === 200, latency, message: `✅ Python服务正常 (${latency}ms)` };
    } catch (error) {
      return { success: false, latency: Date.now() - startTime, message: `❌ 连接失败: ${error}` };
    }
  }

  public async get<T = any>(url: string, config?: any): Promise<T> {
    const client = await this.getClient();
    const response = await client.get<T>(url, config);
    return response.data;
  }

  public async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const client = await this.getClient();
    const response = await client.post<T>(url, data, config);
    return response.data;
  }

  public async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const client = await this.getClient();
    const response = await client.put<T>(url, data, config);
    return response.data;
  }

  public async delete<T = any>(url: string, config?: any): Promise<T> {
    const client = await this.getClient();
    const response = await client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiService();
export type { PythonConfig };

// 市场数据 API - FIX 2: 路由改为 /api/v1
export const marketApi = {
  // 获取全市场快照 - 对应后端 /api/v1/market/snapshot
  async getSnapshot() {
    const response = await apiClient.get<{ columns: string[]; data: any[][] }>('/api/v1/market/snapshot');

    // FIX 3: 将 Split JSON 格式转换为对象数组
    if (response && response.columns && response.data) {
      return response.data.map(row => {
        const item: any = {};
        response.columns.forEach((col, index) => item[col] = row[index]);
        return {
          ticker: item.code,
          name: item.name,
          price: item.price,
          changePercent: item.pct_chg,
          volume: item.vol,
          industry: item.industry || 'Unclassified',
          change: item.change || 0
        };
      });
    }
    return [];
  },

  // 获取K线数据 - 对应后端 /api/v1/market/kline/{ticker}
  async getKline(ticker: string, limit: number = 500) {
    const response = await apiClient.get<{ columns: string[]; data: any[][] }>(`/api/v1/market/kline/${ticker}?limit=${limit}`);

    if (response && response.columns && response.data) {
      return response.data.map(row => {
        const item: any = {};
        response.columns.forEach((col, index) => item[col] = row[index]);
        return {
          date: item.date,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.vol
        };
      });
    }
    return [];
  },

  // 获取股票数据
  async getQuote(ticker: string) {
    return apiClient.get<any>(`/api/v1/market/quote/${ticker}`);
  },

  // 搜索股票
  async search(query: string) {
    return apiClient.get<any[]>(`/api/v1/market/search?q=${encodeURIComponent(query)}`);
  }
};

// 分析 API
export const analysisApi = {
  async calculateRSRS(ticker: string, period: number = 20) {
    return apiClient.get<any>(`/api/v1/analysis/rsrs/${ticker}?period=${period}`);
  },
  async calculateVolatilitySkew(ticker: string, shortPeriod: number = 5, longPeriod: number = 20) {
    return apiClient.get<any>(`/api/v1/analysis/volatility/${ticker}?short=${shortPeriod}&long=${longPeriod}`);
  },
  async analyze(ticker: string) {
    return apiClient.get<any>(`/api/v1/analysis/${ticker}`);
  },
  async getRiskSignals() {
    return apiClient.get<any[]>('/api/v1/analysis/risk-signals');
  }
};

// 报告 API
export const reportApi = {
  async generateReport(ticker: string, context: string) {
    return apiClient.post<any>('/api/v1/report/generate', { ticker, context });
  },
  async getReports(limit: number = 10) {
    return apiClient.get<any[]>(`/api/v1/reports?limit=${limit}`);
  },
  async getReport(id: string) {
    return apiClient.get<any>(`/api/v1/reports/${id}`);
  }
};

// 投资组合 API
export const portfolioApi = {
  async getPositions() {
    return apiClient.get<any[]>('/api/v1/portfolio/positions');
  },
  async addPosition(position: { ticker: string; shares: number; avgCost: number }) {
    return apiClient.post<any>('/api/v1/portfolio/positions', position);
  },
  async getSummary() {
    return apiClient.get<any>('/api/v1/portfolio/summary');
  }
};

// 导出快捷方法
export const api = {
  get: <T = any>(url: string, config?: any) => apiClient.get<T>(url, config),
  post: <T = any>(url: string, data?: any, config?: any) => apiClient.post<T>(url, data, config),
  put: <T = any>(url: string, data?: any, config?: any) => apiClient.put<T>(url, data, config),
  delete: <T = any>(url: string, config?: any) => apiClient.delete<T>(url, config),
  testConnection: () => apiClient.testConnection(),
  getConfig: () => apiClient.getConfig(),
};

export default apiClient;
