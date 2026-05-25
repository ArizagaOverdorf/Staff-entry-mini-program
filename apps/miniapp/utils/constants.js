/**
 * 全局常量定义
 */

// API 基础地址（开发环境）
// 生产环境需替换为实际域名
const API_BASE_URL = 'http://localhost:3000/api';

// 小程序端 API 前缀
const APP_API_PREFIX = '/app';

// 完整的 API 地址映射
const API = {
  // 认证相关
  LOGIN: APP_API_PREFIX + '/auth/wechat-login',
  PHONE_BIND: APP_API_PREFIX + '/auth/bind-phone',
  LOGOUT: APP_API_PREFIX + '/auth/logout',

  // 隐私确认
  PRIVACY_CONFIRM: APP_API_PREFIX + '/account/privacy-agree',

  // 个人信息
  PROFILE: APP_API_PREFIX + '/profile',
  PROFILE_UPDATE: APP_API_PREFIX + '/profile',

  // 字典（服务类别/服务区域）
  DICTS: APP_API_PREFIX + '/dicts',
  SERVICE_CATEGORIES: APP_API_PREFIX + '/dicts',
  SERVICE_AREAS: APP_API_PREFIX + '/dicts',

  // 文件上传
  FILES_UPLOAD: APP_API_PREFIX + '/files/upload',

  // 证件
  CREDENTIALS: APP_API_PREFIX + '/credentials',
  CREDENTIAL_UPLOAD: APP_API_PREFIX + '/files/upload',

  // 入驻提交
  SUBMIT_INTAKE: APP_API_PREFIX + '/intake/submit',
  INTAKE_PREVIEW: APP_API_PREFIX + '/intake/preview',
  INTAKE_STATUS: APP_API_PREFIX + '/intake/status',

  // 上架状态
  LISTING_STATUS: APP_API_PREFIX + '/listing/status',
  LISTING_PAUSE: APP_API_PREFIX + '/listing/pause',
  LISTING_RESUME: APP_API_PREFIX + '/listing/resume',

  // 服务记录
  SERVICE_RECORDS: APP_API_PREFIX + '/service-records',

  // 消息
  MESSAGES: APP_API_PREFIX + '/messages',
  MESSAGE_UNREAD_COUNT: APP_API_PREFIX + '/messages/unread-count',
  MESSAGE_READ: APP_API_PREFIX + '/messages/read',

  // 账号
  ACCOUNT_INFO: APP_API_PREFIX + '/account/me'
};

// 入驻状态
const INTAKE_STATUS = {
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  INFO_REQUIRED: 'needs_more_info'
};

const INTAKE_STATUS_LABEL = {
  draft: '草稿',
  pending_review: '待审核',
  approved: '已通过',
  rejected: '已驳回',
  needs_more_info: '需补充资料'
};

// 上架状态
const LISTING_STATUS = {
  ON: 'on',
  OFF: 'off',
  PAUSED: 'paused'
};

const LISTING_STATUS_LABEL = {
  on: '已上架',
  off: '未上架',
  paused: '已暂停'
};

// 证件状态
const CREDENTIAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired'
};

const CREDENTIAL_STATUS_LABEL = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
  expired: '已过期'
};

// 证件 badges
const CREDENTIAL_BADGE = {
  EXPIRING_SOON: 'expiring_soon',
  EXPIRED: 'expired'
};

// 证件类型
const CREDENTIAL_TYPES = [
  { value: 'id_card', label: '身份证' },
  { value: 'health_cert', label: '健康证' },
  { value: 'no_crime_cert', label: '无犯罪记录证明' },
  { value: 'credit_report', label: '征信报告' },
  { value: 'medical_report', label: '体检报告' },
  { value: 'insurance', label: '保险' },
  { value: 'skill_cert', label: '技能证书' },
  { value: 'education', label: '学历/毕业证' },
  { value: 'student_card', label: '学生证' },
  { value: 'other', label: '其他' }
];

// 强准入证件类型
const MANDATORY_CREDENTIAL_TYPES = [
  'id_card',
  'health_cert',
  'no_crime_cert',
  'credit_report',
  'medical_report'
];

// 消息状态
const MESSAGE_STATUS = {
  UNREAD: 'unread',
  READ: 'read'
};

// 性别
const GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' }
];

module.exports = {
  API_BASE_URL,
  API,
  INTAKE_STATUS,
  INTAKE_STATUS_LABEL,
  LISTING_STATUS,
  LISTING_STATUS_LABEL,
  CREDENTIAL_STATUS,
  CREDENTIAL_STATUS_LABEL,
  CREDENTIAL_BADGE,
  CREDENTIAL_TYPES,
  MANDATORY_CREDENTIAL_TYPES,
  MESSAGE_STATUS,
  GENDER_OPTIONS
};
