const authUtil = require('../../utils/auth');
const request = require('../../utils/request');
const constants = require('../../utils/constants');

Page({
  data: {
    staffInfo: null,
    intakeStatus: '',
    intakeStatusLabel: '',
    listingStatus: '',
    listingStatusLabel: '',
    isAvailable: false,
    hasProfile: false,
    hasCredentials: false,
    unreadMsgCount: 0,
    staffAvatarText: '服',
    loaded: false
  },

  onLoad() {
    this.checkAuth();
  },

  onShow() {
    if (authUtil.isLoggedIn()) {
      this.loadDashboard();
      this.loadUnreadCount();
    }
  },

  checkAuth() {
    if (!authUtil.isLoggedIn()) {
      wx.redirectTo({
        url: '/pages/auth/index'
      });
      return;
    }
  },

  loadDashboard() {
    const that = this;
    request.get(constants.API.INTAKE_STATUS).then((res) => {
      const intakeStatus = res.intakeStatus || constants.INTAKE_STATUS.DRAFT;
      const listingStatus = res.listingStatus || constants.LISTING_STATUS.OFF;
      const staffInfo = res.staffInfo || null;
      const staffName = staffInfo && staffInfo.name ? staffInfo.name : '';

      that.setData({
        staffInfo: staffInfo,
        staffAvatarText: staffName ? staffName.slice(0, 1) : '服',
        intakeStatus: intakeStatus,
        intakeStatusLabel: constants.INTAKE_STATUS_LABEL[intakeStatus] || '未知',
        listingStatus: listingStatus,
        listingStatusLabel: constants.LISTING_STATUS_LABEL[listingStatus] || '未知',
        isAvailable: res.isAvailable || false,
        hasProfile: res.hasProfile || false,
        hasCredentials: res.hasCredentials || false,
        loaded: true
      });
    }).catch(() => {
      that.setData({ loaded: true });
    });
  },

  loadUnreadCount() {
    request.get(constants.API.MESSAGES, { unreadOnly: true, pageSize: 1 }).then((res) => {
      this.setData({
        unreadMsgCount: res.total || 0
      });
    }).catch(() => {
      // ignore
    });
  },

  // 跳转到个人资料
  goToProfile() {
    wx.navigateTo({
      url: '/pages/profile/view/index'
    });
  },

  // 跳转到证件管理
  goToCredentials() {
    wx.navigateTo({
      url: '/pages/credential/index'
    });
  },

  // 跳转到入驻提交
  goToSubmit() {
    if (!this.data.hasProfile) {
      wx.showToast({
        title: '请先完善个人资料',
        icon: 'none'
      });
      return;
    }
    if (!this.data.hasCredentials) {
      wx.showToast({
        title: '请先上传证件',
        icon: 'none'
      });
      return;
    }
    wx.navigateTo({
      url: '/pages/submit/index'
    });
  },

  // 跳转到审核进度
  goToAudit() {
    wx.navigateTo({
      url: '/pages/audit/status'
    });
  },

  // 跳转到服务记录
  goToServiceRecord() {
    wx.navigateTo({
      url: '/pages/service-record/index'
    });
  },

  // 跳转到消息
  goToMessage() {
    wx.navigateTo({
      url: '/pages/message/index'
    });
  },

  // 跳转到账号设置
  goToAccount() {
    wx.navigateTo({
      url: '/pages/account/index'
    });
  },

  onShareAppMessage() {
    return {
      title: '家政服务人员入驻'
    };
  }
});
