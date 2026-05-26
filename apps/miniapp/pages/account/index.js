const authUtil = require('../../utils/auth');
const request = require('../../utils/request');
const constants = require('../../utils/constants');

Page({
  data: {
    accountInfo: null,
    accountAvatarText: '服',
    loaded: false
  },

  onLoad() {
    this.loadAccountInfo();
  },

  onShow() {
    this.loadAccountInfo();
  },

  loadAccountInfo() {
    const that = this;
    request.get(constants.API.ACCOUNT_INFO).then((res) => {
      const account = res.account || res;
      const displayName =
        account.name ||
        account.wechatNickname ||
        (account.profile && account.profile.realNameMasked) ||
        '家政人员';
      const phone = account.phone || account.phoneMasked || '未绑定手机号';

      that.setData({
        accountInfo: {
          ...account,
          name: displayName,
          phone: phone
        },
        accountAvatarText: displayName ? displayName.slice(0, 1) : '服',
        loaded: true
      });
    }).catch(() => {
      that.setData({ loaded: true });
    });
  },

  // 查看个人资料
  goToProfile() {
    wx.navigateTo({
      url: '/pages/profile/view/index'
    });
  },

  // 编辑个人资料
  goToEditProfile() {
    wx.navigateTo({
      url: '/pages/profile/edit/index'
    });
  },

  // 退出登录
  handleLogout() {
    const that = this;
    wx.showModal({
      title: '提示',
      content: '确定退出登录吗？',
      success(res) {
        if (res.confirm) {
          that.doLogout();
        }
      }
    });
  },

  doLogout() {
    request.post(constants.API.LOGOUT).then(() => {
      // 无论成功与否都清除本地数据
    }).catch(() => {
      // ignore
    }).finally(() => {
      authUtil.removeToken();
      wx.reLaunch({
        url: '/pages/auth/index'
      });
    });
  },

  // 关于
  handleAbout() {
    wx.showModal({
      title: '关于',
      content: '家政服务人员入驻小程序 v1.0.0',
      showCancel: false
    });
  }
});
