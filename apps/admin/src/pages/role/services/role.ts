import request from '../../../services/request';

export interface RoleRecord {
  id: number;
  name: string;
  code: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PermissionNode {
  id: number;
  name: string;
  code: string;
  parentId: number | null;
  sort: number;
  children?: PermissionNode[];
}

export interface RolePermission {
  roleId: number;
  permissionIds: number[];
}

export async function listRoles(): Promise<RoleRecord[]> {
  return request.get('/roles');
}

export async function getRoleDetail(id: number): Promise<RoleRecord> {
  return request.get(`/roles/${id}`);
}

export async function getPermissionTree(): Promise<PermissionNode[]> {
  return request.get('/permissions/tree');
}

export async function getRolePermissions(roleId: number): Promise<{ permissionIds: number[] }> {
  return request.get(`/roles/${roleId}/permissions`);
}

export async function assignPermissions(data: RolePermission): Promise<void> {
  return request.put(`/roles/${data.roleId}/permissions`, data);
}
