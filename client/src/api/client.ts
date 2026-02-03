import axios from 'axios';
import { useServerConfig } from '../contexts/ServerConfigContext';

// 创建API客户端实例
export function createApiClient() {
  const { config } = useServerConfig();
  
  const client = axios.create({
    baseURL: config.baseUrl,
    timeout: config.timeout,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 请求拦截器 - 添加认证token
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers['X-Auth-Token'] = token;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 响应拦截器 - 统一错误处理
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        // 服务器返回错误
        const { status, data } = error.response;
        
        switch (status) {
          case 401:
            // 未授权，清除token并提示登录
            localStorage.removeItem('auth_token');
            break;
          case 429:
            // 速率限制
            console.warn('Rate limit exceeded. Please try again later.');
            break;
          case 500:
            // 服务器错误
            console.error('Server error:', data.message || 'Unknown error');
            break;
        }
      } else if (error.request) {
        // 请求发送失败（网络问题）
        console.error('Network error. Please check your connection.');
      }
      
      return Promise.reject(error);
    }
  );

  return client;
}

// 默认导出单例
export const apiClient = createApiClient();
