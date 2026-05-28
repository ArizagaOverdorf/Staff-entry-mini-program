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
    if (!authUtil.isMobileBound()) {
      wx.redirectTo({
        url: '/pages/auth/phone-bind/index'
      });
      return;
    }
    request.get(constants.API.ACCOUNT_INFO).then((res) => {
      if (res.privacyAgreed) {
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
    if (!authUtil.isMobileBound()) {
      wx.redirectTo({
        url: '/pages/auth/phone-bind/index'
      });
      return;
    }

    this.setData({ isSubmitting: true });

    request.post(constants.API.PRIVACY_CONFIRM, { agreed: true }).then(() => {
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
      wx.showToast({
        title: '请求失败，请重试',
        icon: 'none',
        duration: 2000
      });
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
