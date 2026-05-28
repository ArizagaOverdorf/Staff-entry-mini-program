const request = require('../../utils/request');
const constants = require('../../utils/constants');

const REQUIRED_CREDENTIALS = [
  {
    typeId: 'id_card',
    title: '身份证正反面',
    desc: '必传，请在同一证件内上传正面和反面两张图片'
  },
  {
    typeId: 'health_cert',
    title: '健康证',
    desc: '必传，请上传有效期内健康证'
  },
  {
    typeId: 'no_crime_cert',
    title: '无犯罪记录证明',
    desc: '必传，请上传公安机关或指定渠道出具的证明'
  },
  {
    typeId: 'credit_report',
    title: '征信报告',
    desc: '必传，请上传个人征信报告'
  },
  {
    typeId: 'medical_report',
    title: '体检报告',
    desc: '必传，请上传近期体检报告'
  }
];

const OPTIONAL_CREDENTIALS = [
  {
    typeId: 'insurance',
    title: '保险',
    desc: '选填，可上传意外险、责任险等材料'
  },
  {
    typeId: 'education',
    title: '学历/毕业证',
    desc: '选填，适用于看重学历背景的服务'
  },
  {
    typeId: 'student_card',
    title: '学生证',
    desc: '选填，适用于未毕业学生兼职'
  },
  {
    typeId: 'other',
    title: '其他资料',
    desc: '选填，可上传补充证明材料'
  }
];

function getStatusLabel(status) {
  return constants.CREDENTIAL_STATUS_LABEL[status] || '未上传';
}

function getStatusClass(status) {
  const map = {
    pending: 'tag-warning',
    approved: 'tag-success',
    rejected: 'tag-error',
    expired: 'tag-error'
  };
  return map[status] || 'tag-info';
}

function getTypeLabel(typeId) {
  const item = constants.CREDENTIAL_TYPES.find((type) => type.value === typeId);
  return item ? item.label : typeId;
}

function normalizeCredential(credential) {
  const status = credential.status || credential.credentialStatus || 'pending';
  const typeId = credential.typeId || credential.credentialType;
  const linkedSkills = credential.linkedSkills || [];
  return {
    ...credential,
    typeId,
    typeName: credential.typeName || getTypeLabel(typeId),
    status,
    statusLabel: getStatusLabel(status),
    statusClass: getStatusClass(status),
    fileCount: credential.files ? credential.files.length : 0,
    skillLevelText: credential.skillLevel
      ? `技能等级：${credential.skillLevel}`
      : '未填写技能等级',
    linkedSkillText: linkedSkills.length > 0
      ? `已关联 ${linkedSkills.length} 项技能`
      : ''
  };
}

function buildUploadCards(types, credentials) {
  return types.map((item) => {
    const credential = credentials.find((c) => c.typeId === item.typeId);
    return {
      ...item,
      typeName: getTypeLabel(item.typeId),
      credentialId: credential ? credential.id : '',
      hasCredential: !!credential,
      statusLabel: credential ? credential.statusLabel : '未上传',
      statusClass: credential ? credential.statusClass : 'tag-info',
      fileCount: credential ? credential.fileCount : 0,
      actionText: credential ? '查看/更新' : '去上传'
    };
  });
}

Page({
  data: {
    credentials: [],
    requiredCredentialCards: [],
    skillCertificates: [],
    optionalCredentialCards: [],
    loaded: false,
    isSubmitting: false
  },

  onLoad() {
    this.loadCredentials();
  },

  onShow() {
    this.loadCredentials();
  },

  loadCredentials() {
    const that = this;
    request.get(constants.API.CREDENTIALS).then((res) => {
      const list = (res.list || res.credentials || []).map(normalizeCredential);
      const currentList = list.filter((item) => item.isCurrent !== false);
      const skillCertificates = currentList.filter((item) => item.typeId === 'skill_cert');

      that.setData({
        credentials: currentList,
        requiredCredentialCards: buildUploadCards(REQUIRED_CREDENTIALS, currentList),
        skillCertificates,
        optionalCredentialCards: buildUploadCards(OPTIONAL_CREDENTIALS, currentList),
        loaded: true
      });
    }).catch(() => {
      that.setData({ loaded: true });
    });
  },

  goToCredentialType(e) {
    const typeId = e.currentTarget.dataset.type;
    const typeName = e.currentTarget.dataset.name || getTypeLabel(typeId);
    const credentialId = e.currentTarget.dataset.id;

    if (credentialId) {
      wx.navigateTo({
        url: '/pages/credential/edit/index?id=' + credentialId
      });
      return;
    }

    wx.navigateTo({
      url: `/pages/credential/edit/index?typeId=${typeId}&typeName=${encodeURIComponent(typeName)}`
    });
  },

  goToSkillCertUpload() {
    wx.navigateTo({
      url: `/pages/credential/edit/index?typeId=skill_cert&typeName=${encodeURIComponent('技能证书')}`
    });
  },

  goToEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/credential/edit/index?id=' + id
    });
  },

  handleSubmitReview() {
    if (this.data.isSubmitting) return;

    this.setData({ isSubmitting: true });
    request.get(constants.API.INTAKE_PREVIEW).then((preview) => {
      if (!preview.canSubmit) {
        const issues = preview.issues || [];
        wx.showModal({
          title: '资料不完整',
          content: issues.length > 0
            ? issues.slice(0, 5).join('\n')
            : '请先完善个人资料和必填证件后再提交审核。',
          showCancel: false
        });
        return Promise.reject(new Error('资料不完整'));
      }

      return new Promise((resolve, reject) => {
        wx.showModal({
          title: '提交审核',
          content: '确认提交当前资料进入审核流程？',
          success: (res) => {
            if (res.confirm) {
              resolve();
            } else {
              reject(new Error('用户取消提交'));
            }
          },
          fail: reject
        });
      });
    }).then(() => {
      return request.post(constants.API.SUBMIT_INTAKE);
    }).then(() => {
      wx.showToast({
        title: '已提交审核',
        icon: 'success',
        duration: 1500
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }).catch((err) => {
      if (err && err.message !== '资料不完整' && err.message !== '用户取消提交') {
        console.error('提交审核失败', err);
      }
    }).finally(() => {
      this.setData({ isSubmitting: false });
    });
  }
});
