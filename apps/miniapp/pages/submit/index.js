const request = require('../../utils/request');
const constants = require('../../utils/constants');

Page({
  data: {
    profileSummary: null,
    credentialCount: 0,
    approvedCredentialCount: 0,
    serviceCategories: [],
    serviceAreas: [],
    loaded: false,
    isSubmitting: false,
    canSubmit: false,
    issues: [],
    mandatoryCredentials: [],
    skillCredentialRequirements: []
  },

  onLoad() {
    this.loadSummary();
  },

  loadSummary() {
    const that = this;

    // 加载入驻预览（包含资料摘要 + 证件统计 + 强制证件 + 技能证书要求）
    request.get(constants.API.INTAKE_PREVIEW).then((res) => {
      that.setData({
        profileSummary: {
          name: res.profileCompleted ? '已填写' : '未填写',
          skillsCount: res.skillsCount || 0,
          serviceAreasCount: res.serviceAreasCount || 0
        },
        credentialCount: res.credentialsCount || 0,
        canSubmit: res.canSubmit || false,
        issues: res.issues || [],
        mandatoryCredentials: res.mandatoryCredentials || [],
        skillCredentialRequirements: res.skillCredentialRequirements || [],
        loaded: true
      });
    }).catch(() => {
      // 回退：分别加载
      request.get(constants.API.PROFILE).then((res) => {
        that.setData({
          profileSummary: res.profile || res,
          serviceCategories: res.serviceCategoryNames || [],
          serviceAreas: res.serviceAreaNames || []
        });
      }).catch(() => {});

      request.get(constants.API.CREDENTIALS).then((res) => {
        const list = res.list || res.credentials || [];
        const approved = list.filter(c => c.status === 'approved').length;
        that.setData({
          credentialCount: list.length,
          approvedCredentialCount: approved,
          loaded: true
        });
      }).catch(() => {
        that.setData({ loaded: true });
      });
    });
  },

  handleSubmit() {
    const that = this;
    if (this.data.isSubmitting) return;

    if (!this.data.canSubmit) {
      wx.showModal({
        title: '资料不完整',
        content: '请先完善个人资料和证件信息后再提交。',
        showCancel: false
      });
      return;
    }

    wx.showModal({
      title: '确认提交',
      content: '确认提交入驻申请？提交后资料将进入审核流程。',
      success(res) {
        if (res.confirm) {
          that.doSubmit();
        }
      }
    });
  },

  doSubmit() {
    this.setData({ isSubmitting: true });

    request.post(constants.API.SUBMIT_INTAKE).then((res) => {
      wx.showToast({
        title: '提交成功',
        icon: 'success',
        duration: 2000
      });
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/home/index'
        });
      }, 2000);
    }).catch((err) => {
      console.error('提交失败', err);
    }).finally(() => {
      this.setData({ isSubmitting: false });
    });
  },

  getMandatoryStatusClass(cred) {
    if (cred.hasCredential && cred.credentialStatus === 'approved') return 'status-approved';
    if (cred.hasCredential && cred.credentialStatus === 'pending') return 'status-pending';
    if (cred.hasCredential) return 'status-rejected';
    return 'status-missing';
  },

  getMandatoryStatusLabel(cred) {
    if (!cred.hasCredential) return '未上传';
    if (cred.credentialStatus === 'approved') return '已通过';
    if (cred.credentialStatus === 'pending') return '待审核';
    if (cred.credentialStatus === 'rejected') return '已驳回';
    return cred.credentialStatus || '未知';
  },

  getSkillCertStatusLabel(req) {
    if (req.hasSkillCert && req.coveringCredentialStatus === 'approved') return '已通过';
    if (req.hasSkillCert && req.coveringCredentialStatus === 'pending') return '待审核';
    if (req.hasSkillCert) return '已驳回';
    return '缺少';
  },

  goToEditProfile() {
    wx.navigateTo({
      url: '/pages/profile/edit/index'
    });
  },

  goToEditCredential() {
    wx.navigateTo({
      url: '/pages/credential/index'
    });
  }
});
