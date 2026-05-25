const authUtil = require('../../../utils/auth');
const request = require('../../../utils/request');
const constants = require('../../../utils/constants');

Page({
  data: {
    isBinding: false,
    canBind: true
  },

  onLoad() {
    // 如果已经登录并且绑定了手机号，直接跳转
    if (authUtil.isLoggedIn()) {
      const staffId = authUtil.getStaffId();
      if (staffId) {
        wx.redirectTo({
          url: '/pages/privacy/index'
        });
      }
    }
  },

  // 获取手机号回调
  handleGetPhoneNumber(e) {
    const that = this;

    if (this.data.isBinding) return;

    if (e.detail.errMsg !== 'getPhoneNumber:ok') {
      wx.showToast({
        title: '需要绑定手机号才能继续',
        icon: 'none'
      });
      return;
    }

    this.setData({ isBinding: true });

    const code = e.detail.code;
    const encryptedData = e.detail.encryptedData;
    const iv = e.detail.iv;

    // 获取微信登录 code
    authUtil.wxLogin().then((loginCode) => {
      return request.post(constants.API.PHONE_BIND, {
        loginCode: loginCode,
        phoneCode: code,
        encryptedData: encryptedData,
        iv: iv
      });
    }).then((res) => {
      if (res.token) {
        authUtil.setToken(res.token);
      }
      if (res.staffId) {
        authUtil.setStaffId(res.staffId);
      }
      wx.showToast({
        title: '绑定成功',
        icon: 'success',
        duration: 1500
      });
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/privacy/index'
        });
      }, 1500);
    }).catch((err) => {
      console.error('手机号绑定失败', err);
    }).finally(() => {
      that.setData({ isBinding: false });
    });
  },

  // 跳过（仅在开发/测试环境使用）
  handleSkip() {
    wx.redirectTo({
      url: '/pages/privacy/index'
    });
  }
});
