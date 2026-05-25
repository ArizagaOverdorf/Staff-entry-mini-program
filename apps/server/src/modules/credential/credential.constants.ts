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
  CREDIT_REPORT: 'credit_report',
  MEDICAL_REPORT: 'medical_report',
  INSURANCE: 'insurance',
  SKILL_CERT: 'skill_cert',
  EDUCATION: 'education',
  OTHER: 'other',
} as const;

export const CredentialTypeLabels: Record<string, string> = {
  id_card: '身份证',
  health_cert: '健康证',
  no_crime_cert: '无犯罪记录证明',
  credit_report: '征信报告',
  medical_report: '体检报告',
  insurance: '保险',
  skill_cert: '技能证书',
  education: '学历',
  other: '其他',
};

export const MANDATORY_CREDENTIAL_TYPES = [
  'id_card',
  'health_cert',
  'no_crime_cert',
  'credit_report',
  'medical_report',
];

export const SKILL_CREDENTIAL_REQUIRED_CATEGORY_IDS = [
  'nanny',
  'elderly_care',
  'postpartum_care',
  'infant_care',
  'nursing',
];
