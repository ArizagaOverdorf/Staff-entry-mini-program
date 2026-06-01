const authUtil = require('../../utils/auth');
const request = require('../../utils/request');
const constants = require('../../utils/constants');

const MOCK_SMS_CODE = '123456';

Page({
  data: {
    canLogin: true,
    isLogging: false,
    isSendingCode: false,
    countdown: 0,
    phone: '',
    smsCode: '',
    agreed: false
  },

  onLoad() {
    if (authUtil.isLoggedIn()) {
      authUtil.checkSession().then((valid) => {
        if (valid) {
          this.checkExistingAccount();
        } else {
          authUtil.removeToken();
          this.setData({ canLogin: true });
        }
      });
    }
  },

  onUnload() {
    this.clearCountdownTimer();
  },

  checkExistingAccount() {
    request.get(constants.API.ACCOUNT_INFO, {}, { silent: true }).then((res) => {
      authUtil.setMobileBound(!!res.mobileBound);
      if (res.mobileBound && res.privacyAgreed) {
        wx.redirectTo({ url: '/pages/home/index' });
      }
    }).catch(() => {});
  },

  handlePhoneInput(e) {
    this.setData({ phone: (e.detail.value || '').trim() });
  },

  handleCodeInput(e) {
    this.setData({ smsCode: (e.detail.value || '').trim() });
  },

  handleAgreementChange(e) {
    this.setData({ agreed: (e.detail.value || []).indexOf('agreed') > -1 });
  },

  validatePhone() {
    const phone = (this.data.phone || '').trim();
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '请输入正确手机号', icon: 'none' });
      return false;
    }
    return true;
  },

  handleSendCode() {
    if (this.data.isSendingCode || this.data.countdown > 0) return;
    if (!this.validatePhone()) return;

    this.setData({ isSendingCode: true });
    setTimeout(() => {
      this.setData({ isSendingCode: false, countdown: 60 });
      wx.showToast({ title: '验证码已发送', icon: 'success' });
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

  ensureWechatLogin() {
    if (authUtil.isLoggedIn()) {
      return Promise.resolve();
    }
    return authUtil.wxLogin().then((code) => {
      return request.post(constants.API.LOGIN, { code: code });
    }).then((res) => {
      if (!res.token) {
        return Promise.reject(new Error('登录失败，请重试'));
      }
      authUtil.setToken(res.token);
      if (res.staffId) {
        authUtil.setStaffId(res.staffId);
      }
      authUtil.setMobileBound(!!res.mobileBound);
    });
  },

  handlePhoneLogin() {
    if (this.data.isLogging) return;
    if (!this.validatePhone()) return;

    const smsCode = (this.data.smsCode || '').trim();
    if (!/^\d{6}$/.test(smsCode)) {
      wx.showToast({ title: '请输入6位验证码', icon: 'none' });
      return;
    }
    if (!this.data.agreed) {
      wx.showToast({ title: '请先勾选同意协议', icon: 'none' });
      return;
    }

    this.setData({ isLogging: true });

    this.ensureWechatLogin().then(() => {
      return request.post(constants.API.PHONE_BIND, {
        phone: this.data.phone,
        smsCode
      });
    }).then((res) => {
      if (res.token) {
        authUtil.setToken(res.token);
      }
      if (res.staffId) {
        authUtil.setStaffId(res.staffId);
      }
      authUtil.setMobileBound(true);
      return request.post(constants.API.PRIVACY_CONFIRM, { agreed: true });
    }).then(() => {
      wx.showToast({ title: '登录成功', icon: 'success', duration: 1200 });
      setTimeout(() => {
        wx.redirectTo({ url: '/pages/home/index' });
      }, 1200);
    }).catch((err) => {
      console.error('登录失败', err);
    }).finally(() => {
      this.setData({ isLogging: false });
    });
  },

  showUserAgreement() {
    wx.showModal({
      title: '用户服务协议',
      content: '这里展示家政服务人员入驻小程序的用户服务协议。正式上线前应替换为完整协议文本。',
      showCancel: false
    });
  },

  showPrivacyPolicy() {
    wx.showModal({
      title: '隐私政策',
      content: '这里展示隐私政策摘要。正式上线前应替换为经确认的完整隐私政策文本。',
      showCancel: false
    });
  },

  onShareAppMessage() {
    return {
      title: '家政服务人员入驻'
    };
  }
});
