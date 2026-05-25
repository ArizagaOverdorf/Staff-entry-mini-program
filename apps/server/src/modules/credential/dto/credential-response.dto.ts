export interface CredentialResponse {
  id: string;
  credentialType: string;
  credentialName: string;
  credentialNumber?: string;
  issuingAuthority?: string;
  issueDate?: string;
  expiryDate?: string;
  credentialStatus: string;
  credentialBadge?: string;
  files: CredentialFileResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CredentialFileResponse {
  id: string;
  fileType: string;
  fileAsset: {
    id: string;
    originalName: string;
    mimeType: string;
    size: number;
  };
}
