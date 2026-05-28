const authUtil = require('../../utils/auth');
const request = require('../../utils/request');
const constants = require('../../utils/constants');

function getAvatarText(name) {
  return name ? name.slice(0, 1) : '服';
}

function getQualificationClass(status) {
  if (status === 'approved' || status === 'normal') return 'success';
  if (status === 'credential_expired' || status === 'expired' || status === 'paused') return 'warning';
  if (status === 'banned' || status === 'rejected') return 'error';
  return 'warning';
}

function normalizeOnlineStatus(listingStatus, isAvailable) {
  if (isAvailable || listingStatus === 'on' || listingStatus === 'online') {
    return {
      label: '上线中',
      status: 'on',
      className: 'success',
      nextAction: '休息'
    };
  }
  return {
    label: '休息中',
    status: 'off',
    className: 'warning',
    nextAction: '上线'
  };
}

Page({
  data: {
    staffInfo: null,
    displayName: '家政人员',
    avatarUrl: '',
    staffAvatarText: '服',
    identityVerified: false,
    identityVerifiedLabel: '未实名认证',
    intakeStatus: '',
    intakeStatusLabel: '',
    intakeStatusClass: 'warning',
    listingStatus: '',
    onlineStatusLabel: '休息中',
    onlineStatusClass: 'warning',
    onlineNextAction: '上线',
    isAvailable: false,
    managementStatus: 'normal',
    managementStatusLabel: '服务状态：正常',
    hasProfile: false,
    hasCredentials: false,
    unreadMsgCount: 0,
    loaded: false,
    togglingOnline: false
  },

  onLoad() {
    this.checkAuth();
  },

  onShow() {
    this.checkAuth();
    if (authUtil.isLoggedIn() && authUtil.isMobileBound()) {
      this.loadDashboard();
      this.loadProfileHeader();
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
    if (!authUtil.isMobileBound()) {
      wx.redirectTo({
        url: '/pages/auth/phone-bind/index'
      });
    }
  },

  loadDashboard() {
    request.get(constants.API.INTAKE_STATUS).then((res) => {
      const intakeStatus = res.qualificationStatus || res.intakeStatus || constants.INTAKE_STATUS.DRAFT;
      const online = normalizeOnlineStatus(res.listingStatus, res.isAvailable);
      const managementStatus = res.managementStatus || constants.MANAGEMENT_STATUS.NORMAL;

      this.setData({
        staffInfo: res.staffInfo || null,
        intakeStatus: intakeStatus,
        intakeStatusLabel: constants.QUALIFICATION_STATUS_LABEL[intakeStatus] || '未知',
        intakeStatusClass: getQualificationClass(intakeStatus),
        listingStatus: online.status,
        onlineStatusLabel: online.label,
        onlineStatusClass: online.className,
        onlineNextAction: online.nextAction,
        isAvailable: online.status === 'on',
        managementStatus: managementStatus,
        managementStatusLabel: constants.MANAGEMENT_STATUS_LABEL[managementStatus] || '服务状态：正常',
        hasProfile: res.hasProfile || res.profileCompleted || false,
        hasCredentials: res.hasCredentials || res.credentialsCount > 0 || false,
        loaded: true
      });
    }).catch(() => {
      this.setData({ loaded: true });
    });
  },

  loadProfileHeader() {
    request.get(constants.API.PROFILE).then((res) => {
      const profile = res.profile || {};
      const displayName = profile.name || profile.nameMasked || res.nickname || '家政人员';
      const avatarUrl = profile.avatarUrl || '';
      const identityVerified = !!profile.identityVerified;

      this.setData({
        displayName,
        avatarUrl,
        staffAvatarText: getAvatarText(displayName),
        identityVerified,
        // Reserved for Alibaba Cloud / Tencent Cloud real-name verification result.
        identityVerifiedLabel: identityVerified ? '已实名认证' : '未实名认证'
      });
    }).catch(() => {
      // 保持默认展示
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

  toggleOnlineStatus() {
    if (this.data.togglingOnline) return;
    if (this.data.intakeStatus !== 'approved' && this.data.intakeStatus !== 'normal') {
      wx.showToast({
        title: '入驻状态正常后才能切换上线状态',
        icon: 'none'
      });
      return;
    }

    // Check management status for resume attempt
    const willGoOnline = this.data.listingStatus !== 'on';
    if (willGoOnline && this.data.managementStatus === 'paused') {
      wx.showToast({
        title: '服务状态暂停，暂不能上线',
        icon: 'none'
      });
      return;
    }
    if (willGoOnline && this.data.managementStatus === 'blacklisted') {
      wx.showToast({
        title: '服务状态受限，暂不能上线',
        icon: 'none'
      });
      return;
    }

    const url = willGoOnline ? constants.API.LISTING_RESUME : constants.API.LISTING_PAUSE;

    this.setData({ togglingOnline: true });
    request.post(url).then((res) => {
      const online = normalizeOnlineStatus(res.listingStatus, res.isAvailable);
      this.setData({
        listingStatus: online.status,
        onlineStatusLabel: online.label,
        onlineStatusClass: online.className,
        onlineNextAction: online.nextAction,
        isAvailable: online.status === 'on'
      });
      wx.showToast({
        title: willGoOnline ? '已上线' : '已休息',
        icon: 'success'
      });
    }).catch(() => {
      // request wrapper already shows toast
    }).finally(() => {
      this.setData({ togglingOnline: false });
    });
  },

  goToProfile() {
    wx.navigateTo({
      url: '/pages/profile/view/index'
    });
  },

  goToCredentials() {
    wx.navigateTo({
      url: '/pages/credential/index'
    });
  },

  goToResume() {
    wx.navigateTo({
      url: '/pages/resume/index'
    });
  },

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

  goToAudit() {
    wx.navigateTo({
      url: '/pages/audit/status'
    });
  },

  goToServiceRecord() {
    wx.navigateTo({
      url: '/pages/service-record/index'
    });
  },

  goToMessage() {
    wx.navigateTo({
      url: '/pages/message/index'
    });
  },

  goToAccount() {
    wx.navigateTo({
      url: '/pages/account/index'
    });
  },

  goToIdentity() {
    wx.navigateTo({
      url: '/pages/identity/index'
    });
  },

  onShareAppMessage() {
    return {
      title: '家政服务人员入驻'
    };
  }
});
