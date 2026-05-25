import request from '../../../services/request';

export interface DictGroup {
  id: number;
  name: string;
  code: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DictItem {
  id: number;
  groupId: number;
  label: string;
  value: string;
  sort: number;
  status: number;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDictItemParams {
  groupId: number;
  label: string;
  value: string;
  sort?: number;
  status?: number;
  remark?: string;
}

export interface UpdateDictItemParams {
  id: number;
  label?: string;
  value?: string;
  sort?: number;
  status?: number;
  remark?: string;
}

export async function listDictGroups(): Promise<DictGroup[]> {
  return request.get('/dict/groups');
}

export async function listDictItems(groupId: number): Promise<DictItem[]> {
  return request.get(`/dict/groups/${groupId}/items`);
}

export async function createDictItem(params: CreateDictItemParams): Promise<DictItem> {
  return request.post('/dict/items', params);
}

export async function updateDictItem(params: UpdateDictItemParams): Promise<DictItem> {
  return request.put(`/dict/items/${params.id}`, params);
}
