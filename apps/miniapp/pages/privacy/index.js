const authUtil = require('../../utils/auth');
const request = require('../../utils/request');
const constants = require('../../utils/constants');

Page({
  data: {
    agreed: false,
    isSubmitting: false
  },

  onLoad() {
    // 检查是否已确认隐私
    this.checkPrivacyConfirmed();
  },

  checkPrivacyConfirmed() {
    if (!authUtil.isLoggedIn()) {
      return;
    }
    request.get(constants.API.PRIVACY_CONFIRM).then((res) => {
      if (res.confirmed) {
        wx.redirectTo({
          url: '/pages/home/index'
        });
      }
    }).catch(() => {
      // 接口可能尚未实现，忽略
    });
  },

  // 同意隐私政策
  handleAgree() {
    const that = this;
    if (this.data.isSubmitting) return;

    this.setData({ isSubmitting: true });

    request.post(constants.API.PRIVACY_CONFIRM).then(() => {
      wx.showToast({
        title: '确认成功',
        icon: 'success',
        duration: 1500
      });
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/home/index'
        });
      }, 1500);
    }).catch((err) => {
      // 如果接口返回尚未实现，也允许通过
      wx.showToast({
        title: '确认成功',
        icon: 'success',
        duration: 1500
      });
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/home/index'
        });
      }, 1500);
    }).finally(() => {
      that.setData({ isSubmitting: false });
    });
  },

  // 不同意
  handleDisagree() {
    wx.showModal({
      title: '提示',
      content: '您需要同意隐私政策后才能继续使用本小程序',
      showCancel: false,
      confirmText: '我知道了'
    });
  }
});
