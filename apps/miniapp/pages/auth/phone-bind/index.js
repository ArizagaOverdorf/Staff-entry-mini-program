const request = require('../../../utils/request');
const authUtil = require('../../../utils/auth');
const constants = require('../../../utils/constants');

const MOCK_SMS_CODE = '123456';

Page({
  data: {
    isBinding: false,
    isSendingCode: false,
    countdown: 0,
    phone: '',
    smsCode: ''
  },

  onUnload() {
    this.clearCountdownTimer();
  },

  handlePhoneInput(e) {
    this.setData({
      phone: (e.detail.value || '').trim()
    });
  },

  handleCodeInput(e) {
    this.setData({
      smsCode: (e.detail.value || '').trim()
    });
  },

  validatePhone() {
    const phone = (this.data.phone || '').trim();
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({
        title: '请输入正确手机号',
        icon: 'none'
      });
      return false;
    }
    return true;
  },

  handleSendCode() {
    if (this.data.isSendingCode || this.data.countdown > 0) return;
    if (!this.validatePhone()) return;

    this.setData({ isSendingCode: true });

    setTimeout(() => {
      this.setData({
        isSendingCode: false,
        countdown: 60
      });
      wx.showToast({
        title: '验证码已发送',
        icon: 'success'
      });
      wx.showModal({
        title: '本地测试验证码',
        content: `当前开发环境使用验证码 ${MOCK_SMS_CODE}。上线后再接入真实短信服务。`,
        showCancel: false
      });
      this.startCountdown();
    }, 300);
  },

  startCountdown() {
    this.clearCountdownTimer();
    this.countdownTimer = setInterval(() => {
      const next = Math.max((this.data.countdown || 0) - 1, 0);
      this.setData({ countdown: next });
      if (next === 0) {
        this.clearCountdownTimer();
      }
    }, 1000);
  },

  clearCountdownTimer() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  },

  handleVerifyCodeLogin() {
    if (this.data.isBinding) return;
    if (!this.validatePhone()) return;

    const smsCode = (this.data.smsCode || '').trim();
    if (!/^\d{6}$/.test(smsCode)) {
      wx.showToast({
        title: '请输入6位验证码',
        icon: 'none'
      });
      return;
    }

    this.setData({ isBinding: true });

    request.post(constants.API.PHONE_BIND, {
      phone: this.data.phone,
      smsCode
    }).then((res) => {
      if (res.token) {
        authUtil.setToken(res.token);
      }
      if (res.staffId) {
        authUtil.setStaffId(res.staffId);
      }
      authUtil.setMobileBound(true);
      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500
      });
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/privacy/index'
        });
      }, 1500);
    }).catch((err) => {
      console.error('验证码登录失败', err);
    }).finally(() => {
      this.setData({ isBinding: false });
    });
  }
});
