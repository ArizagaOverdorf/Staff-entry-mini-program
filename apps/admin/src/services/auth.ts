import request from './request';

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  adminUser: {
    id: number;
    username: string;
    realName: string;
    phone: string;
    roleId?: number;
    roleName?: string;
  };
}

export async function login(params: LoginParams): Promise<LoginResult> {
  return request.post('/auth/login', params);
}

export async function getCurrentAdmin(): Promise<LoginResult['adminUser']> {
  return request.get('/auth/current');
}
