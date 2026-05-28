const request = require('../../../utils/request');
const constants = require('../../../utils/constants');

const MOCK_SMS_CODE = '123456';

Page({
  data: {
    identityVerified: false,
    identityVerifiedLabel: '未实名认证',
    isSendingCode: false,
    isSubmitting: false,
    countdown: 0,
    phone: '',
    smsCode: ''
  },

  onLoad() {
    this.loadIdentityStatus();
  },

  onUnload() {
    this.clearCountdownTimer();
  },

  loadIdentityStatus() {
    request.get(constants.API.ACCOUNT_INFO).then((res) => {
      const account = res.account || res;
      const profile = account.profile || {};
      const identityVerified = !!profile.identityVerified;
      this.setData({
        identityVerified,
        identityVerifiedLabel: identityVerified ? '已实名认证' : '未实名认证'
      });
    }).catch(() => {
      this.setData({
        identityVerified: false,
        identityVerifiedLabel: '校验失败'
      });
    });
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

  ensureIdentityVerified() {
    if (this.data.identityVerified) return true;
    wx.showToast({
      title: '请先完成实名认证',
      icon: 'none'
    });
    return false;
  },

  handleSendCode() {
    if (this.data.isSendingCode || this.data.countdown > 0) return;
    if (!this.ensureIdentityVerified()) return;
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

  handleChangePhone() {
    if (this.data.isSubmitting) return;
    if (!this.ensureIdentityVerified()) return;
    if (!this.validatePhone()) return;

    const smsCode = (this.data.smsCode || '').trim();
    if (!/^\d{6}$/.test(smsCode)) {
      wx.showToast({
        title: '请输入6位验证码',
        icon: 'none'
      });
      return;
    }

    this.setData({ isSubmitting: true });

    request.post(constants.API.PHONE_CHANGE, {
      phone: this.data.phone,
      smsCode
    }).then(() => {
      wx.showToast({
        title: '修改成功',
        icon: 'success',
        duration: 1500
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }).catch((err) => {
      console.error('修改手机号失败', err);
    }).finally(() => {
      this.setData({ isSubmitting: false });
    });
  },

  goToIdentity() {
    wx.navigateTo({
      url: '/pages/identity/index'
    });
  }
});
