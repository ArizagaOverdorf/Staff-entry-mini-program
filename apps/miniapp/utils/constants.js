/**
 * 全局常量定义
 */

const API_BASE_URL = 'http://localhost:3000/api';
const APP_API_PREFIX = '/app';

const API = {
  LOGIN: APP_API_PREFIX + '/auth/wechat-login',
  PHONE_BIND: APP_API_PREFIX + '/auth/bind-phone',
  PHONE_CHANGE: APP_API_PREFIX + '/auth/change-phone',
  LOGOUT: APP_API_PREFIX + '/auth/logout',

  PRIVACY_CONFIRM: APP_API_PREFIX + '/account/privacy-agree',

  PROFILE: APP_API_PREFIX + '/profile',
  PROFILE_UPDATE: APP_API_PREFIX + '/profile',

  DICTS: APP_API_PREFIX + '/dicts',
  SERVICE_CATEGORIES: APP_API_PREFIX + '/dicts',
  SERVICE_AREAS: APP_API_PREFIX + '/dicts',

  FILES_UPLOAD: APP_API_PREFIX + '/files/upload',

  CREDENTIALS: APP_API_PREFIX + '/credentials',
  CREDENTIAL_UPLOAD: APP_API_PREFIX + '/files/upload',

  SUBMIT_INTAKE: APP_API_PREFIX + '/intake/submit',
  INTAKE_PREVIEW: APP_API_PREFIX + '/intake/preview',
  INTAKE_STATUS: APP_API_PREFIX + '/intake/status',

  LISTING_STATUS: APP_API_PREFIX + '/listing/status',
  LISTING_PAUSE: APP_API_PREFIX + '/listing/pause',
  LISTING_RESUME: APP_API_PREFIX + '/listing/resume',

  SERVICE_RECORDS: APP_API_PREFIX + '/service-records',

  MESSAGES: APP_API_PREFIX + '/messages',
  MESSAGE_UNREAD_COUNT: APP_API_PREFIX + '/messages/unread-count',
  MESSAGE_READ: APP_API_PREFIX + '/messages/read',

  ACCOUNT_INFO: APP_API_PREFIX + '/account/me'
};

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

const QUALIFICATION_STATUS_LABEL = {
  draft: '未提交',
  pending_review: '审核中',
  reviewing: '审核中',
  approved: '正常',
  normal: '正常',
  credential_expired: '资料过期',
  expired: '资料过期',
  paused: '暂停',
  banned: '封禁',
  rejected: '审核未通过',
  needs_more_info: '资料需补充'
};

const LISTING_STATUS = {
  ON: 'on',
  OFF: 'off',
  PAUSED: 'paused'
};

const LISTING_STATUS_LABEL = {
  on: '上线中',
  online: '上线中',
  off: '休息中',
  offline: '休息中',
  paused: '休息中'
};

const MANAGEMENT_STATUS = {
  NORMAL: 'normal',
  PAUSED: 'paused',
  BLACKLISTED: 'blacklisted'
};

const MANAGEMENT_STATUS_LABEL = {
  normal: '服务状态：正常',
  paused: '服务状态：暂停服务',
  blacklisted: '服务状态：已限制服务'
};

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

const CREDENTIAL_BADGE = {
  EXPIRING_SOON: 'expiring_soon',
  EXPIRED: 'expired'
};

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

const SKILL_LEVEL_OPTIONS = [
  { value: '初级', label: '初级' },
  { value: '中级', label: '中级' },
  { value: '高级', label: '高级' }
];

// 当前阶段先收窄到保姆/月嫂类，后续可由后台字典扩展。
const SERVICE_SKILL_OPTIONS = [
  { value: 'maternity_matron', label: '月嫂' },
  { value: 'childcare_nanny', label: '育儿嫂' },
  { value: 'live_in_nanny', label: '住家保姆' },
  { value: 'daytime_nanny', label: '白班保姆' },
  { value: 'elderly_nanny', label: '养老保姆' }
];

const SERVICE_AREA_OPTIONS = [
  { value: 'nationwide', label: '全国', province: '全国', city: '', district: '', type: 'special' },
  { value: 'foreign', label: '国外', province: '国外', city: '', district: '', type: 'special' },
  { province: '北京市', cities: ['北京市'] },
  { province: '天津市', cities: ['天津市'] },
  { province: '河北省', cities: ['石家庄市', '唐山市', '秦皇岛市', '邯郸市', '保定市', '张家口市'] },
  { province: '山西省', cities: ['太原市', '大同市', '长治市', '晋中市', '临汾市'] },
  { province: '内蒙古自治区', cities: ['呼和浩特市', '包头市', '鄂尔多斯市', '赤峰市'] },
  { province: '辽宁省', cities: ['沈阳市', '大连市', '鞍山市', '抚顺市'] },
  { province: '吉林省', cities: ['长春市', '吉林市', '延边朝鲜族自治州'] },
  { province: '黑龙江省', cities: ['哈尔滨市', '齐齐哈尔市', '大庆市'] },
  { province: '上海市', cities: ['上海市'] },
  { province: '江苏省', cities: ['南京市', '苏州市', '无锡市', '常州市', '南通市', '徐州市'] },
  { province: '浙江省', cities: ['杭州市', '宁波市', '温州市', '嘉兴市', '绍兴市', '金华市'] },
  { province: '安徽省', cities: ['合肥市', '芜湖市', '蚌埠市', '安庆市'] },
  { province: '福建省', cities: ['福州市', '厦门市', '泉州市', '漳州市'] },
  { province: '江西省', cities: ['南昌市', '九江市', '赣州市'] },
  { province: '山东省', cities: ['济南市', '青岛市', '烟台市', '潍坊市', '临沂市'] },
  { province: '河南省', cities: ['郑州市', '洛阳市', '开封市', '南阳市'] },
  { province: '湖北省', cities: ['武汉市', '宜昌市', '襄阳市'] },
  { province: '湖南省', cities: ['长沙市', '株洲市', '岳阳市', '衡阳市'] },
  { province: '广东省', cities: ['广州市', '深圳市', '佛山市', '东莞市', '珠海市', '惠州市', '中山市', '江门市', '汕头市', '湛江市'] },
  { province: '广西壮族自治区', cities: ['南宁市', '柳州市', '桂林市', '北海市'] },
  { province: '海南省', cities: ['海口市', '三亚市'] },
  { province: '重庆市', cities: ['重庆市'] },
  { province: '四川省', cities: ['成都市', '绵阳市', '德阳市', '乐山市', '宜宾市'] },
  { province: '贵州省', cities: ['贵阳市', '遵义市'] },
  { province: '云南省', cities: ['昆明市', '大理白族自治州', '丽江市', '曲靖市'] },
  { province: '西藏自治区', cities: ['拉萨市'] },
  { province: '陕西省', cities: ['西安市', '咸阳市', '宝鸡市', '渭南市'] },
  { province: '甘肃省', cities: ['兰州市', '天水市'] },
  { province: '青海省', cities: ['西宁市'] },
  { province: '宁夏回族自治区', cities: ['银川市'] },
  { province: '新疆维吾尔自治区', cities: ['乌鲁木齐市', '克拉玛依市', '喀什地区', '伊犁哈萨克自治州'] }
];

const MANDATORY_CREDENTIAL_TYPES = [
  'id_card',
  'health_cert',
  'no_crime_cert',
  'credit_report',
  'medical_report'
];

const MESSAGE_STATUS = {
  UNREAD: 'unread',
  READ: 'read'
};

const GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' }
];

module.exports = {
  API_BASE_URL,
  API,
  INTAKE_STATUS,
  INTAKE_STATUS_LABEL,
  QUALIFICATION_STATUS_LABEL,
  LISTING_STATUS,
  LISTING_STATUS_LABEL,
  MANAGEMENT_STATUS,
  MANAGEMENT_STATUS_LABEL,
  CREDENTIAL_STATUS,
  CREDENTIAL_STATUS_LABEL,
  CREDENTIAL_BADGE,
  CREDENTIAL_TYPES,
  SKILL_LEVEL_OPTIONS,
  SERVICE_SKILL_OPTIONS,
  SERVICE_AREA_OPTIONS,
  MANDATORY_CREDENTIAL_TYPES,
  MESSAGE_STATUS,
  GENDER_OPTIONS
};
