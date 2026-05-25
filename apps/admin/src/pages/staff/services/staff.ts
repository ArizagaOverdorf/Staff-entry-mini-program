import request from '../../../services/request';

export interface StaffRecord {
  id: string;
  staffId: string;
  name: string;
  phone: string;
  avatar?: string;
  gender?: string;
  age?: number;
  idNumber?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  serviceCategories?: string[];
  serviceAreas?: string[];
  experience?: string;
  education?: string;
  introduction?: string;
  intakeStatus: string;
  reviewRemark?: string;
  submittedAt?: string;
  reviewedAt?: string;
  listingStatus: string;
  isAvailable: boolean;
  pauseReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CredentialRecord {
  id: string;
  staffId?: string;
  credentialType: string;
  credentialName?: string;
  credentialNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  issuingAuthority?: string;
  status: string;
  badge?: string;
  version?: number;
  isCurrent?: boolean;
  remark?: string;
  files?: CredentialFileRecord[];
}

export interface CredentialFileRecord {
  id: string;
  fileType: string;
  fileAsset: {
    id: string;
    originalName: string;
    mimeType: string;
    size: number;
  };
}

export interface AuditRecordItem {
  id: string;
  action: string;
  remark?: string;
  adminUser?: { id: string; name: string };
  createdAt?: string;
}

export interface StaffListParams {
  page?: number;
  pageSize?: number;
  name?: string;
  phone?: string;
  intakeStatus?: string;
  listingStatus?: string;
}

export interface StaffListResult {
  list: StaffRecord[];
  total: number;
}

export async function listStaff(params?: StaffListParams): Promise<StaffListResult> {
  return request.get('/staff', { params });
}

export async function getStaffDetail(staffId: string): Promise<StaffRecord> {
  return request.get(`/staff/${staffId}`);
}

export async function getStaffCredentials(staffId: string): Promise<CredentialRecord[]> {
  return request.get(`/staff/${staffId}/credentials`);
}

export async function getStaffAuditRecords(staffId: string): Promise<AuditRecordItem[]> {
  return request.get(`/staff/${staffId}/audit-records`);
}

export async function approveIntake(staffId: string, remark?: string): Promise<any> {
  return request.post(`/staff/${staffId}/review/approve`, { remark });
}

export async function rejectIntake(staffId: string, remark?: string): Promise<any> {
  return request.post(`/staff/${staffId}/review/reject`, { remark });
}

export async function requestMoreInfo(staffId: string, remark?: string): Promise<any> {
  return request.post(`/staff/${staffId}/review/request-more-info`, { remark });
}

export async function reviewCredential(
  staffId: string,
  credentialId: string,
  action: 'approve' | 'reject',
  remark?: string,
): Promise<any> {
  return request.post(`/staff/${staffId}/credentials/${credentialId}/review`, {
    action,
    remark,
  });
}

export async function approveCredential(staffId: string, credentialId: string): Promise<any> {
  return reviewCredential(staffId, credentialId, 'approve');
}

export async function rejectCredential(
  staffId: string,
  credentialId: string,
  remark: string,
): Promise<any> {
  return reviewCredential(staffId, credentialId, 'reject', remark);
}
