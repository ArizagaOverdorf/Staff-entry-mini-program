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
  NO_CRIME_CERT: 'no_crime_cert',
  INSURANCE: 'insurance',
  SKILL_CERT: 'skill_cert',
  EDUCATION: 'education',
  OTHER: 'other',
} as const;

export const CredentialTypeLabels: Record<string, string> = {
  id_card: '身份证',
  health_cert: '健康证',
  no_crime_cert: '无犯罪证明',
  insurance: '保险',
  skill_cert: '技能证书',
  education: '学历',
  other: '其他',
};

export const MANDATORY_CREDENTIAL_TYPES = ['id_card', 'health_cert'];
