const authUtil = require('./utils/auth');

App({
  onLaunch() {
    // 检查登录状态
    const token = authUtil.getToken();
    if (token) {
      this.globalData.token = token;
      // 可以在这里做静默登录刷新token
    }

    // 获取系统信息
    const sysInfo = wx.getSystemInfoSync();
    this.globalData.systemInfo = sysInfo;
  },

  globalData: {
    userInfo: null,
    token: null,
    systemInfo: null,
    staffId: null
  }
});
