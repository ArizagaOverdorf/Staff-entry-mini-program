export const CredentialStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
} as const;

export const CredentialBadge = {
  EXPIRING_SOON: 'expiring_soon',
  EXPIRED: 'expired',
  VALID: 'valid',
} as const;

export const CredentialType = {
  ID_CARD: 'id_card',
  HEALTH_CERT: 'health_cert',
  PROFESSIONAL_CERT: 'professional_cert',
  BACKGROUND_CHECK: 'background_check',
  OTHER: 'other',
} as const;
