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
  LOGIN: APP_API_PREFIX + '/auth/login',
  PHONE_BIND: APP_API_PREFIX + '/auth/phone-bind',

  // 隐私确认
  PRIVACY_CONFIRM: APP_API_PREFIX + '/privacy/confirm',

  // 个人信息
  PROFILE: APP_API_PREFIX + '/profile',
  PROFILE_UPDATE: APP_API_PREFIX + '/profile',

  // 服务类别
  SERVICE_CATEGORIES: APP_API_PREFIX + '/dictionary/service-categories',
  SERVICE_AREAS: APP_API_PREFIX + '/dictionary/service-areas',

  // 证件
  CREDENTIALS: APP_API_PREFIX + '/credentials',
  CREDENTIAL_UPLOAD: APP_API_PREFIX + '/credentials/upload',

  // 入驻提交
  SUBMIT_INTAKE: APP_API_PREFIX + '/intake/submit',
  INTAKE_STATUS: APP_API_PREFIX + '/intake/status',

  // 上架状态
  LISTING_STATUS: APP_API_PREFIX + '/listing/status',
  LISTING_PAUSE: APP_API_PREFIX + '/listing/pause',
  LISTING_RESUME: APP_API_PREFIX + '/listing/resume',

  // 服务记录
  SERVICE_RECORDS: APP_API_PREFIX + '/service-records',

  // 消息
  MESSAGES: APP_API_PREFIX + '/messages',
  MESSAGE_READ: APP_API_PREFIX + '/messages/read',

  // 账号
  ACCOUNT_INFO: APP_API_PREFIX + '/account/info',
  LOGOUT: APP_API_PREFIX + '/auth/logout'
};

// 入驻状态
const INTAKE_STATUS = {
  DRAFT: 'draft',               // 草稿
  PENDING_REVIEW: 'pending_review', // 待审核
  APPROVED: 'approved',         // 已通过
  REJECTED: 'rejected',         // 已驳回
  INFO_REQUIRED: 'info_required' // 需补充资料
};

const INTAKE_STATUS_LABEL = {
  draft: '草稿',
  pending_review: '待审核',
  approved: '已通过',
  rejected: '已驳回',
  info_required: '需补充资料'
};

// 上架状态
const LISTING_STATUS = {
  ON: 'on',         // 已上架
  OFF: 'off',       // 未上架
  PAUSED: 'paused'  // 已暂停
};

const LISTING_STATUS_LABEL = {
  on: '已上架',
  off: '未上架',
  paused: '已暂停'
};

// 证件状态
const CREDENTIAL_STATUS = {
  PENDING: 'pending',         // 待上传
  UPLOADED: 'uploaded',       // 已上传待审核
  APPROVED: 'approved',       // 已通过
  REJECTED: 'rejected',       // 已驳回
  EXPIRED: 'expired'          // 已过期
};

const CREDENTIAL_STATUS_LABEL = {
  pending: '待上传',
  uploaded: '待审核',
  approved: '已通过',
  rejected: '已驳回',
  expired: '已过期'
};

// 证件 badges
const CREDENTIAL_BADGE = {
  EXPIRING_SOON: 'expiring_soon', // 即将过期
  EXPIRED: 'expired'              // 已过期
};

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
  MESSAGE_STATUS,
  GENDER_OPTIONS
};
