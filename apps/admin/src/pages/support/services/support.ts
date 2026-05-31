import request from '../../../services/request';

export interface ConversationItem {
  staffAccountId: string;
  staffId: string;
  staffName: string;
  staffPhone: string;
  unreadCount: number;
  latestMessage: {
    title: string;
    content?: string;
    senderType: string;
    messageType: string;
  } | null;
  latestMessageAt: string | null;
}

export interface ConversationListResult {
  list: ConversationItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ConversationMessage {
  id: string;
  staffAccountId: string;
  staffId?: string;
  staffName?: string;
  staffPhone?: string;
  adminUserId?: string;
  adminName?: string;
  title: string;
  content?: string;
  messageType: string;
  senderType: string;
  isRead: boolean;
  readAt?: string;
  adminReadAt?: string;
  createdAt?: string;
}

export interface ConversationDetail {
  staff: {
    staffAccountId: string;
    staffId: string;
    staffName: string;
    staffPhone: string;
  };
  messages: ConversationMessage[];
}

export interface ExportData {
  staff: {
    staffId: string;
    staffName: string;
    staffPhone?: string;
  };
  messages: {
    time: string;
    senderRole: string;
    senderName: string;
    staffId: string;
    title: string;
    content: string;
    messageType: string;
  }[];
  exportedAt: string;
}

export async function listConversations(params?: {
  page?: number;
  pageSize?: number;
  keyword?: string;
}): Promise<ConversationListResult> {
  return request.get('/support/conversations', { params });
}

export async function getConversation(
  staffAccountId: string,
): Promise<ConversationDetail> {
  return request.get(`/support/conversations/${staffAccountId}`);
}

export async function replyToConversation(
  staffAccountId: string,
  content: string,
): Promise<ConversationMessage> {
  return request.post(`/support/conversations/${staffAccountId}/reply`, { content });
}

export async function exportConversation(staffAccountId: string): Promise<ExportData> {
  return request.get(`/support/conversations/${staffAccountId}/export`);
}

export interface UploadedSupportFile {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export async function uploadSupportFile(file: File): Promise<UploadedSupportFile> {
  const formData = new FormData();
  formData.append('file', file);
  return request.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
