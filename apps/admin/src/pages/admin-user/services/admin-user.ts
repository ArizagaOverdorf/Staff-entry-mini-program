import request from '../../../services/request';

export interface AdminUserRecord {
  id: number;
  username: string;
  realName: string;
  phone: string;
  roleId?: number;
  roleName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAdminUserParams {
  username: string;
  realName: string;
  phone: string;
  password: string;
  roleId?: number;
}

export interface UpdateAdminUserParams {
  id: number;
  realName?: string;
  phone?: string;
  password?: string;
  roleId?: number;
}

export async function listAdminUsers(): Promise<AdminUserRecord[]> {
  return request.get('/admin-users');
}

export async function createAdminUser(params: CreateAdminUserParams): Promise<AdminUserRecord> {
  return request.post('/admin-users', params);
}

export async function updateAdminUser(params: UpdateAdminUserParams): Promise<AdminUserRecord> {
  return request.put(`/admin-users/${params.id}`, params);
}
