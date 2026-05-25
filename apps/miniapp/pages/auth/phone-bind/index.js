const authUtil = require('../../../utils/auth');
const request = require('../../../utils/request');
const constants = require('../../../utils/constants');

Page({
  data: {
    isBinding: false,
    canBind: true,
    phone: ''
  },

  onLoad() {
    // 登录后仍需要完成手机号绑定，不在这里按 staffId 自动跳过。
  },

  handlePhoneInput(e) {
    this.setData({
      phone: (e.detail.value || '').trim()
    });
  },

  // 获取手机号回调
  handleGetPhoneNumber(e) {
    const that = this;

    if (this.data.isBinding) return;

    const phone = (this.data.phone || '').trim();

    if (e.detail.errMsg !== 'getPhoneNumber:ok' && !phone) {
      wx.showToast({
        title: '请输入手机号后继续',
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
        code: code,
        encryptedData: encryptedData,
        iv: iv,
        phone: phone
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
