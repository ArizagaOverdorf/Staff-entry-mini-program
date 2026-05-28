const authUtil = require('../../utils/auth');
const request = require('../../utils/request');
const constants = require('../../utils/constants');

Page({
  data: {
    canLogin: true,
    isLogging: false,
    isPhoneBound: false
  },

  onLoad() {
    // 检查是否已登录
    if (authUtil.isLoggedIn()) {
      // 检查会话是否有效
      authUtil.checkSession().then((valid) => {
        if (valid) {
          wx.redirectTo({
            url: '/pages/home/index'
          });
        } else {
          authUtil.removeToken();
          this.setData({ canLogin: true });
        }
      });
    }
  },

  // 微信登录
  handleWechatLogin() {
    const that = this;
    if (this.data.isLogging) return;

    this.setData({ isLogging: true });

    authUtil.wxLogin().then((code) => {
      // 调用后端登录接口
      return request.post(constants.API.LOGIN, { code: code });
    }).then((res) => {
      if (res.token) {
        authUtil.setToken(res.token);
        if (res.staffId) {
          authUtil.setStaffId(res.staffId);
        }
        authUtil.setMobileBound(!!res.mobileBound);
        // 检查是否需要绑定手机号
        if (res.mobileBound) {
          // 检查是否已确认隐私
          if (res.privacyAgreed) {
            wx.redirectTo({
              url: '/pages/home/index'
            });
          } else {
            wx.redirectTo({
              url: '/pages/privacy/index'
            });
          }
        } else {
          // 跳转到手机号绑定页
          wx.redirectTo({
            url: '/pages/auth/phone-bind/index'
          });
        }
      }
    }).catch((err) => {
      console.error('登录失败', err);
    }).finally(() => {
      that.setData({ isLogging: false });
    });
  },

  onShareAppMessage() {
    return {
      title: '家政服务人员入驻'
    };
  }
});
