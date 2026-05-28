const request = require('../../utils/request');
const constants = require('../../utils/constants');

const SENSITIVE_AUDIT_TYPES = [
  { typeId: 'id_card', label: '身份证', dateMode: 'none' },
  { typeId: 'no_crime_cert', label: '无犯罪记录证明', dateMode: 'issue' },
  { typeId: 'health_cert', label: '健康证', dateMode: 'expiry' },
  { typeId: 'credit_report', label: '征信报告', dateMode: 'expiry' },
  { typeId: 'medical_report', label: '体检报告', dateMode: 'expiry' }
];

const DEMO_SERVICE_RECORDS = [
  {
    id: 'demo-20260527',
    dateText: '2026/05/27',
    addressText: '佛山',
    projectText: '月嫂',
    durationText: '26天',
    amountText: '12000元',
    violationText: '否',
    violation: false
  }
];

function getAvatarText(name) {
  return name ? name.slice(0, 1) : '简';
}

function getGenderLabel(value) {
  if (value === 'male' || value === 1) return '男';
  if (value === 'female' || value === 2) return '女';
  return '未填写';
}

function getAge(birthday) {
  if (!birthday) return '';
  const birth = new Date(birthday);
  if (Number.isNaN(birth.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age > 0 ? `${age}岁` : '';
}

function formatAreas(areas) {
  if (!areas || areas.length === 0) return '';
  return areas
    .map((area) => [area.province, area.city, area.district].filter(Boolean).join(''))
    .filter(Boolean)
    .join('、');
}

function currentCredentials(credentials) {
  return (credentials || []).filter((item) => item.isCurrent !== false);
}

function findCredential(credentials, typeId) {
  return credentials.find((item) => (item.typeId || item.credentialType) === typeId);
}

function isApproved(credential) {
  return credential && (credential.status || credential.credentialStatus) === 'approved';
}

function getAuditText(credential) {
  if (!credential) return '未上传';
  return isApproved(credential) ? '已审核通过' : '未审核通过';
}

function getAuditDateText(credential, dateMode) {
  if (!credential || !isApproved(credential)) return '';
  if (dateMode === 'issue') {
    return credential.issueDate ? `开具日期：${formatDate(credential.issueDate)}` : '开具日期：未填写';
  }
  if (dateMode === 'expiry') {
    const expireDate = credential.expireDate || credential.expiryDate;
    return expireDate ? `有效期至：${formatDate(expireDate)}` : '有效期：未填写';
  }
  return '';
}

function isInsuranceValid(credential) {
  if (!isApproved(credential)) return false;
  const expireDate = credential.expireDate || credential.expiryDate;
  if (!expireDate) return true;
  return new Date(expireDate).getTime() >= Date.now();
}

function formatSkillCertificate(credential) {
  const linkedSkills = credential.linkedSkills || [];
  const skillName = linkedSkills
    .map((item) => item.categoryName)
    .filter(Boolean)
    .join('、') || '未关联技能';

  return {
    id: credential.id,
    certName: credential.name || credential.credentialName || '技能证书',
    skillName,
    skillLevel: credential.skillLevel || '未填写',
    approved: isApproved(credential),
    statusText: getAuditText(credential)
  };
}

function buildIntro(displayName, serviceCategories, serviceAreaText) {
  const serviceText = serviceCategories.map((item) => item.categoryName).filter(Boolean).join('、');
  const parts = [`${displayName}已完成平台基础资料登记`];
  if (serviceText) parts.push(`可提供${serviceText}等家政服务`);
  if (serviceAreaText) parts.push(`主要服务区域为${serviceAreaText}`);
  return `${parts.join('，')}。简历中的证件材料仅展示平台审核结论，不展示证件原件和敏感身份信息。`;
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

function normalizeServiceRecord(record) {
  const durationMinutes = record.serviceDurationMinutes || record.durationMinutes;
  const durationText = record.durationText || record.duration || (
    durationMinutes ? `${Math.round(durationMinutes / 144) / 10}天` : ''
  );
  const amount = record.amount || record.serviceAmount || record.orderAmount;
  const violation = !!(record.violation || record.isViolation || record.isDisputed);

  return {
    id: record.id || `${record.serviceDate || record.date}-${record.serviceProject || record.project}`,
    dateText: record.dateText || formatDate(record.serviceDate || record.date),
    addressText: record.addressText || record.serviceAddress || record.city || record.address || '未填写',
    projectText: record.projectText || record.serviceProject || record.project || record.serviceTypeName || '家政服务',
    durationText: durationText || '未填写',
    amountText: record.amountText || (amount ? `${amount}元` : '未填写'),
    violationText: violation ? '是' : '否',
    violation
  };
}

Page({
  data: {
    displayName: '家政人员',
    avatarUrl: '',
    avatarText: '简',
    identityVerified: false,
    identityVerifiedLabel: '未实名认证',
    genderLabel: '未填写',
    ageText: '',
    introText: '',
    serviceSummary: '',
    serviceCategories: [],
    serviceAreaText: '',
    auditItems: [],
    skillCertificates: [],
    educationItems: [],
    insuranceText: '无效',
    insuranceValid: false,
    serviceRecords: [],
    managementStatus: 'normal',
    managementStatusLabel: '服务状态：正常'
  },

  onLoad() {
    this.loadResume();
  },

  onShow() {
    this.loadResume();
  },

  loadResume() {
    Promise.all([
      request.get(constants.API.PROFILE),
      request.get(constants.API.CREDENTIALS),
      request.get(constants.API.SERVICE_RECORDS, { page: 1, pageSize: 3 }).catch(() => ({ list: [] })),
      request.get(constants.API.INTAKE_STATUS)
    ]).then(([profileRes, credentialRes, recordRes, intakeRes]) => {
      const profile = profileRes.profile || {};
      const credentials = currentCredentials(credentialRes.list || credentialRes.credentials || []);
      const serviceCategories = profile.serviceCategories || [];
      const displayName = profile.name || profile.nameMasked || '家政人员';
      const identityVerified = !!profile.identityVerified;
      const insurance = findCredential(credentials, 'insurance');
      const insuranceValid = isInsuranceValid(insurance);
      const records = recordRes.list || recordRes.records || [];

      const managementStatus = intakeRes.managementStatus || 'normal';

      this.setData({
        displayName,
        avatarUrl: profile.avatarUrl || '',
        avatarText: getAvatarText(displayName),
        identityVerified,
        identityVerifiedLabel: identityVerified ? '已实名认证' : '未实名认证',
        genderLabel: getGenderLabel(profile.gender),
        ageText: getAge(profile.birthday),
        serviceSummary: serviceCategories.map((item) => item.categoryName).filter(Boolean).join('、'),
        serviceCategories,
        serviceAreaText: formatAreas(profile.serviceAreas),
        managementStatus,
        managementStatusLabel: constants.MANAGEMENT_STATUS_LABEL[managementStatus] || '服务状态：正常',
        auditItems: SENSITIVE_AUDIT_TYPES.map((item) => {
          const credential = findCredential(credentials, item.typeId);
          const approved = isApproved(credential);
          return {
            ...item,
            approved,
            statusText: approved ? '已审核通过' : getAuditText(credential),
            dateText: getAuditDateText(credential, item.dateMode)
          };
        }),
        skillCertificates: credentials
          .filter((item) => (item.typeId || item.credentialType) === 'skill_cert')
          .map(formatSkillCertificate),
        educationItems: [
          { label: '最高学历/毕业证', statusText: getAuditText(findCredential(credentials, 'education')), approved: isApproved(findCredential(credentials, 'education')) },
          { label: '学生证', statusText: getAuditText(findCredential(credentials, 'student_card')), approved: isApproved(findCredential(credentials, 'student_card')) }
        ],
        insuranceText: insuranceValid ? '有效' : '无效',
        insuranceValid,
        serviceRecords: records.length > 0 ? records.map(normalizeServiceRecord) : DEMO_SERVICE_RECORDS,
        introText: buildIntro(displayName, serviceCategories, formatAreas(profile.serviceAreas))
      });
    }).catch((err) => {
      console.error('加载简历失败', err);
      wx.showToast({
        title: '简历加载失败',
        icon: 'none'
      });
    });
  },

  onShareAppMessage() {
    return {
      title: `${this.data.displayName}的家政服务简历`
    };
  }
});
