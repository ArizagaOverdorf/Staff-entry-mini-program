import request from '../../../services/request';

export interface DictGroup {
  id: string;
  name: string;
  code: string;
  description?: string;
  itemCount?: number;
}

export interface DictItem {
  id: string;
  dictGroup: string;
  dictKey: string;
  dictValue: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDictItemParams {
  dictGroup: string;
  dictKey: string;
  dictValue: string;
  parentId?: string;
  sortOrder?: number;
  remark?: string;
}

export interface UpdateDictItemParams {
  id: string;
  dictValue?: string;
  sortOrder?: number;
  isActive?: boolean;
  remark?: string;
}

export async function listDictGroups(): Promise<DictGroup[]> {
  return request.get('/dict/groups');
}

export async function listDictItems(dictGroup: string): Promise<DictItem[]> {
  return request.get(`/dict/groups/${encodeURIComponent(dictGroup)}/items`);
}

export async function createDictItem(params: CreateDictItemParams): Promise<DictItem> {
  return request.post('/dicts', params);
}

export async function updateDictItem(params: UpdateDictItemParams): Promise<DictItem> {
  const { id, ...data } = params;
  return request.put(`/dicts/${id}`, data);
}
