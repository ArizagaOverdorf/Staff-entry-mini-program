import request from '../../../services/request';

export interface RoleRecord {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PermissionNode {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  sortOrder: number;
  children?: PermissionNode[];
}

export interface RolePermission {
  roleId: string;
  permissionIds: string[];
}

export interface CreateRoleParams {
  name: string;
  code: string;
  description?: string;
}

export async function createRole(params: CreateRoleParams): Promise<RoleRecord> {
  return request.post('/roles', params);
}

export async function listRoles(): Promise<RoleRecord[]> {
  return request.get('/roles');
}

export async function getRoleDetail(id: string): Promise<RoleRecord> {
  return request.get(`/roles/${id}`);
}

export async function getPermissionTree(): Promise<PermissionNode[]> {
  return request.get('/permissions/tree');
}

export async function getRolePermissions(
  roleId: string,
): Promise<{ permissionIds: string[] }> {
  return request.get(`/roles/${roleId}/permissions`);
}

export async function assignPermissions(
  roleId: string,
  permissionIds: string[],
): Promise<void> {
  return request.put(`/roles/${roleId}/permissions`, { permissionIds });
}
