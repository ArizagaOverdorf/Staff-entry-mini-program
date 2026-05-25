const constants = require('./constants');

/**
 * 认证相关工具函数
 */
const auth = {
  /**
   * 保存 token 到本地存储
   */
  setToken(token) {
    try {
      wx.setStorageSync('token', token);
    } catch (e) {
      console.error('保存 token 失败', e);
    }
  },

  /**
   * 从本地存储获取 token
   */
  getToken() {
    try {
      return wx.getStorageSync('token') || '';
    } catch (e) {
      return '';
    }
  },

  /**
   * 移除 token
   */
  removeToken() {
    try {
      wx.removeStorageSync('token');
      wx.removeStorageSync('staffId');
    } catch (e) {
      console.error('移除 token 失败', e);
    }
  },

  /**
   * 保存 staffId
   */
  setStaffId(staffId) {
    try {
      wx.setStorageSync('staffId', staffId);
    } catch (e) {
      console.error('保存 staffId 失败', e);
    }
  },

  /**
   * 获取 staffId
   */
  getStaffId() {
    try {
      return wx.getStorageSync('staffId') || '';
    } catch (e) {
      return '';
    }
  },

  /**
   * 检查是否已登录
   */
  isLoggedIn() {
    const token = this.getToken();
    return !!token;
  },

  /**
   * wx.login 封装
   */
  wxLogin() {
    return new Promise((resolve, reject) => {
      wx.login({
        success(res) {
          if (res.code) {
            resolve(res.code);
          } else {
            reject(new Error('微信登录失败：' + res.errMsg));
          }
        },
        fail(err) {
          reject(new Error('微信登录调用失败：' + err.errMsg));
        }
      });
    });
  },

  /**
   * 检查会话是否有效
   */
  checkSession() {
    return new Promise((resolve, reject) => {
      wx.checkSession({
        success() {
          resolve(true);
        },
        fail() {
          resolve(false);
        }
      });
    });
  },

  /**
   * 跳转到登录页
   */
  redirectToLogin() {
    wx.redirectTo({
      url: '/pages/auth/index'
    });
  }
};

module.exports = auth;
