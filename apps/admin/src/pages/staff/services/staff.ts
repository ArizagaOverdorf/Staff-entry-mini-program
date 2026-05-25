import request from '../../../services/request';

export interface StaffRecord {
  id: number;
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
  listingStatus: string;
  isAvailable: boolean;
  pauseReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CredentialRecord {
  id: number;
  staffId: string;
  credentialType: string;
  credentialName?: string;
  credentialNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  status: string;
  badge?: string;
  fileUrl?: string;
  remark?: string;
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
