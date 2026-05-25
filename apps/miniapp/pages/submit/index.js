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
    isSubmitting: false
  },

  onLoad() {
    this.loadSummary();
  },

  loadSummary() {
    const that = this;
    // 加载个人资料摘要
    request.get(constants.API.PROFILE).then((res) => {
      that.setData({
        profileSummary: res.profile || res,
        serviceCategories: res.serviceCategoryNames || [],
        serviceAreas: res.serviceAreaNames || []
      });
    }).catch(() => {});

    // 加载证件摘要
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
  },

  // 提交入驻申请
  handleSubmit() {
    const that = this;
    if (this.data.isSubmitting) return;

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

  // 返回编辑资料
  goToEditProfile() {
    wx.navigateTo({
      url: '/pages/profile/edit/index'
    });
  },

  // 返回编辑证件
  goToEditCredential() {
    wx.navigateTo({
      url: '/pages/credential/index'
    });
  }
});
