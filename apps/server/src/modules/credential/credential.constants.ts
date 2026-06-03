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
  STUDENT_CARD: 'student_card',
  OTHER: 'other',
} as const;

export const CredentialTypeLabels: Record<string, string> = {
  id_card: '居民身份证',
  health_cert: '健康证',
  no_crime_cert: '无犯罪记录证明',
  credit_report: '征信报告',
  medical_report: '体检报告',
  insurance: '保险',
  skill_cert: '技能证书',
  education: '学历/毕业证',
  student_card: '学生证',
  other: '其他',
};

export const MANDATORY_CREDENTIAL_TYPES = [
  'id_card',
  'health_cert',
  'no_crime_cert',
  'credit_report',
  'medical_report',
];

export const MANDATORY_CREDENTIAL_TYPES_FULL = MANDATORY_CREDENTIAL_TYPES;

export const SKILL_CREDENTIAL_REQUIRED_CATEGORY_IDS = [
  'nanny',
  'elderly_care',
  'postpartum_care',
  'infant_care',
  'nursing',
];

export const CREDENTIAL_TYPES_REQUIRE_EXPIRY = [
  'health_cert',
  'insurance',
];

export const CREDENTIAL_TYPES_REQUIRE_ISSUE_DATE = [
  'no_crime_cert',
  'credit_report',
  'medical_report',
];

export const ALLOWED_SKILL_LEVELS = ['初级', '中级', '高级', '专家'] as const;

export const ALLOWED_SKILL_CERT_CATEGORY_IDS = [
  'maternity_matron',
  'childcare_nanny',
  'live_in_nanny',
  'daytime_nanny',
  'elderly_nanny',
] as const;

// ============================================================
// Independent skill toggles (not certificate-backed)
// ============================================================

export const INDEPENDENT_SKILL_KEYS = ['cleaning', 'cook'] as const;

export const INDEPENDENT_SKILL_LABELS: Record<string, string> = {
  cleaning: '保洁',
  cook: '厨师',
};

// ============================================================
// Certificate-backed skill names for 技能一/二/三
// ============================================================

export const CERTIFICATE_SKILL_NAMES = [
  '月嫂',
  '育婴员',
  '育婴师',
  '育儿嫂',
  '家政服务员',
  '母婴护理师',
  '产后恢复师',
  '产后康复师',
  '催乳师',
  '保育员',
  '整理收纳师',
  '小儿推拿师',
  '早期教育指导师',
  '老年护理师',
  '养老护理师',
  '护工',
  '陪诊师',
  '保姆',
  '管家',
  '中式管家',
  '家电清洗师',
  '公共营养师',
  '健康管理师',
  '中式面点师',
  '护士',
  '医师',
] as const;

// ============================================================
// Related service skills (multi-select for each skill entry)
// ============================================================

export const RELATED_SERVICE_SKILLS = [
  '月嫂',
  '育儿嫂',
  '住家保姆',
  '白班保姆',
  '养老保姆',
  '保洁',
  '厨师',
  '护士',
] as const;
