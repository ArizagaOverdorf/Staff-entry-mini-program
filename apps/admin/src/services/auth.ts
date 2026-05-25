import request from './request';
import type { AdminUser } from '../utils/auth';

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  adminUser: AdminUser;
}

export async function login(params: LoginParams): Promise<LoginResult> {
  return request.post('/auth/login', params);
}

export async function getCurrentAdmin(): Promise<AdminUser> {
  return request.get('/auth/me');
}
