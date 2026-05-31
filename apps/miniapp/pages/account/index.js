const authUtil = require('../../utils/auth');
const request = require('../../utils/request');
const constants = require('../../utils/constants');
const { normalizeAvatarUrl, getAvatarText, resolveAvatarValue } = require('../../utils/avatar');

Page({
  data: {
    accountInfo: {},
    accountAvatarText: '账',
    accountAvatarUrl: '',
    cacheSizeText: '计算中',
    loaded: false
  },

  onLoad() {
    this.loadAccountInfo();
    this.updateCacheSize();
  },

  onShow() {
    this.loadAccountInfo();
    this.updateCacheSize();
  },

  loadAccountInfo() {
    request.get(constants.API.ACCOUNT_INFO).then((res) => {
      const account = res.account || res;
      const profile = account.profile || {};
      const displayName =
        account.name ||
        account.wechatNickname ||
        profile.realNameMasked ||
        '家政人员';
      const phone = account.phone || account.phoneMasked || '未绑定手机号';

      this.setData({
        accountInfo: {
          ...account,
          name: displayName,
          phone: phone,
          identityVerified: !!profile.identityVerified
        },
        accountAvatarUrl: normalizeAvatarUrl(resolveAvatarValue(profile, account)),
        accountAvatarText: getAvatarText(displayName, '账'),
        loaded: true
      });
    }).catch(() => {
      this.setData({ loaded: true });
    });
  },

  handleUserAgreement() {
    wx.showModal({
      title: '用户服务协议',
      content: '这里展示家政服务人员入驻小程序的用户服务协议。正式上线前应替换为完整协议文本。',
      showCancel: false
    });
  },

  handlePrivacyPolicy() {
    wx.showModal({
      title: '隐私政策',
      content: '这里展示隐私政策摘要。正式上线前应替换为经确认的完整隐私政策文本。',
      showCancel: false
    });
  },

  handleAbout() {
    wx.showModal({
      title: '关于我们',
      content: '家政服务人员入驻小程序 v1.0.0',
      showCancel: false
    });
  },

  handleChangePhone() {
    if (!this.data.accountInfo.identityVerified) {
      wx.showModal({
        title: '需要实名认证',
        content: '修改手机号需要先确认当前微信账号已完成实名认证。正式上线后这里会接入阿里云或腾讯云实名核验。',
        confirmText: '去认证',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/identity/index'
            });
          }
        }
      });
      return;
    }

    wx.navigateTo({
      url: '/pages/auth/phone-change/index'
    });
  },

  updateCacheSize() {
    try {
      const info = wx.getStorageInfoSync();
      const sizeKb = info.currentSize || 0;
      const cacheSizeText = sizeKb >= 1024
        ? (sizeKb / 1024).toFixed(1) + 'MB'
        : sizeKb + 'KB';
      this.setData({ cacheSizeText });
    } catch (e) {
      this.setData({ cacheSizeText: '未知' });
    }
  },

  handleClearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '将清除本地临时缓存，登录状态会保留。',
      confirmText: '清除',
      success: (res) => {
        if (!res.confirm) {
          return;
        }
        this.clearLocalCache();
      }
    });
  },

  clearLocalCache() {
    const keepKeys = ['token', 'staffId', 'mobileBound'];
    try {
      const info = wx.getStorageInfoSync();
      info.keys.forEach((key) => {
        if (!keepKeys.includes(key)) {
          wx.removeStorageSync(key);
        }
      });
      this.updateCacheSize();
      wx.showToast({
        title: '已清除',
        icon: 'success'
      });
    } catch (e) {
      wx.showToast({
        title: '清除失败',
        icon: 'none'
      });
    }
  },

  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          this.doLogout();
        }
      }
    });
  },

  doLogout() {
    request.post(constants.API.LOGOUT).catch(() => {
      // ignore
    }).finally(() => {
      authUtil.removeToken();
      wx.reLaunch({
        url: '/pages/auth/index'
      });
    });
  }
});
