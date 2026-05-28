import request from '../../../services/request';

export interface ServiceRecordItem {
  id: string;
  staffAccountId: string;
  staffId?: string;
  staffName?: string;
  staffPhone?: string;
  serviceDate?: string;
  externalOrderNo?: string;
  serviceProject?: string;
  serviceAddress?: string;
  serviceDurationMinutes?: number;
  serviceAmount?: number;
  customerName?: string;
  serviceDesc?: string;
  rating?: number;
  isDisputed: boolean;
  disputeResult?: string;
  disputeRemark?: string;
  recordSource: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceRecordListParams {
  page?: number;
  pageSize?: number;
  staffKeyword?: string;
  serviceProject?: string;
  dateFrom?: string;
  dateTo?: string;
  isDisputed?: boolean;
}

export interface ServiceRecordListResult {
  list: ServiceRecordItem[];
  total: number;
}

export interface CreateServiceRecordInput {
  staffAccountId: string;
  serviceDate?: string;
  externalOrderNo?: string;
  serviceProject?: string;
  serviceAddress?: string;
  serviceDurationMinutes?: number;
  serviceAmount?: number;
  customerName?: string;
  serviceDesc?: string;
  rating?: number;
  isDisputed?: boolean;
  disputeResult?: string;
  disputeRemark?: string;
  recordSource?: string;
}

export interface UpdateServiceRecordInput {
  serviceDate?: string;
  externalOrderNo?: string;
  serviceProject?: string;
  serviceAddress?: string;
  serviceDurationMinutes?: number;
  serviceAmount?: number;
  customerName?: string;
  serviceDesc?: string;
  rating?: number;
  isDisputed?: boolean;
  disputeResult?: string;
  disputeRemark?: string;
}

export async function listServiceRecords(
  params?: ServiceRecordListParams,
): Promise<ServiceRecordListResult> {
  return request.get('/service-records', { params });
}

export async function getServiceRecord(id: string): Promise<ServiceRecordItem> {
  return request.get(`/service-records/${id}`);
}

export async function createServiceRecord(
  data: CreateServiceRecordInput,
): Promise<ServiceRecordItem> {
  return request.post('/service-records', data);
}

export async function updateServiceRecord(
  id: string,
  data: UpdateServiceRecordInput,
): Promise<ServiceRecordItem> {
  return request.put(`/service-records/${id}`, data);
}

export async function deleteServiceRecord(id: string): Promise<any> {
  return request.delete(`/service-records/${id}`);
}
