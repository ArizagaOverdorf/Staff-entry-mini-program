import request from '../../../services/request';

export interface SupportMessageItem {
  id: string;
  staffAccountId: string;
  staffId?: string;
  staffName?: string;
  staffPhone?: string;
  title: string;
  content?: string;
  messageType: string;
  isRead: boolean;
  readAt?: string;
  createdAt?: string;
}

export interface SupportListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  messageType?: string;
  isRead?: boolean;
}

export interface SupportListResult {
  list: SupportMessageItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function listSupportMessages(
  params?: SupportListParams,
): Promise<SupportListResult> {
  return request.get('/support', { params });
}

export async function getSupportMessageDetail(
  messageId: string,
): Promise<SupportMessageItem> {
  return request.get(`/support/${messageId}`);
}

export async function replySupportMessage(
  messageId: string,
  content: string,
): Promise<SupportMessageItem> {
  return request.post(`/support/${messageId}/reply`, { content });
}
