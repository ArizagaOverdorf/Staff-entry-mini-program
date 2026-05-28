const request = require('../../utils/request');
const constants = require('../../utils/constants');

Page({
  data: {
    identityVerified: false,
    identityVerifiedLabel: '未实名认证',
    identityVerifyProvider: ''
  },

  onLoad() {
    this.loadIdentityStatus();
  },

  onShow() {
    this.loadIdentityStatus();
  },

  loadIdentityStatus() {
    request.get(constants.API.PROFILE).then((res) => {
      const profile = res.profile || {};
      const identityVerified = !!profile.identityVerified;
      this.setData({
        identityVerified,
        identityVerifiedLabel: identityVerified ? '已实名认证' : '未实名认证',
        identityVerifyProvider: profile.identityVerifyProvider || ''
      });
    }).catch(() => {
      // keep default state
    });
  },

  handleStartVerify() {
    wx.showModal({
      title: '实名认证',
      content: '实名认证接口尚未接入。后续可接入阿里云或腾讯云实名核验，认证成功后自动更新首页状态。',
      showCancel: false
    });
  }
});
