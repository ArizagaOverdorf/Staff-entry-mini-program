import request from '../../../services/request';

export interface AdminUserRecord {
  id: string;
  username: string;
  realName: string;
  phone: string;
  isActive: boolean;
  isSuper: boolean;
  roles?: { id: string; code: string; name: string }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAdminUserParams {
  username: string;
  realName: string;
  phone: string;
  password: string;
  roleIds?: string[];
}

export interface UpdateAdminUserParams {
  id: string;
  realName?: string;
  phone?: string;
  password?: string;
  isActive?: boolean;
  roleIds?: string[];
}

export async function listAdminUsers(params?: {
  page?: number;
  pageSize?: number;
}): Promise<{ items: AdminUserRecord[]; total: number; page: number; pageSize: number }> {
  return request.get('/users', { params });
}

export async function createAdminUser(
  params: CreateAdminUserParams,
): Promise<AdminUserRecord> {
  return request.post('/users', params);
}

export async function updateAdminUser(
  params: UpdateAdminUserParams,
): Promise<AdminUserRecord> {
  const { id, ...data } = params;
  return request.put(`/users/${id}`, data);
}
