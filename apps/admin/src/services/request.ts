import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { API_BASE } from '../utils/constants';
import { getToken, clearAuth } from '../utils/auth';

const request = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

request.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error: AxiosError<{ message?: string }>) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        clearAuth();
        message.error('登录已过期，请重新登录');
        window.location.href = '/login';
      } else {
        message.error(data?.message || `请求失败 (${status})`);
      }
    } else {
      message.error('网络错误，请稍后重试');
    }
    return Promise.reject(error);
  },
);

export default request;
