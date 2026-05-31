const constants = require('./constants');

/**
 * 基于 wx.request 封装的 HTTP 请求工具
 * 自动添加 Bearer token，处理 401 错误
 */
const request = {
  /**
   * 获取存储的 token
   */
  _getToken() {
    try {
      return wx.getStorageSync('token') || '';
    } catch (e) {
      return '';
    }
  },

  /**
   * 请求拦截：添加 header
   */
  _buildHeader(contentType) {
    const token = this._getToken();
    const header = {};
    if (token) {
      header['Authorization'] = 'Bearer ' + token;
    }
    if (contentType) {
      header['Content-Type'] = contentType;
    }
    return header;
  },

  /**
   * 统一请求方法
   */
  _request(method, url, data, options) {
    const that = this;
    const baseUrl = constants.API_BASE_URL;
    const contentType = (options && options.contentType) || 'application/json';

    return new Promise((resolve, reject) => {
      wx.request({
        url: baseUrl + url,
        method: method,
        data: data,
        header: that._buildHeader(contentType),
        timeout: 15000,
        success(res) {
          if (res.statusCode === 401) {
            // token 过期或无效，清除 token 并跳转到登录页
            wx.removeStorageSync('token');
            wx.removeStorageSync('staffId');
            wx.redirectTo({
              url: '/pages/auth/index'
            });
            reject(new Error('登录已过期，请重新登录'));
            return;
          }

          if (res.statusCode >= 200 && res.statusCode < 300) {
            const body = res.data;
            if (body && typeof body === 'object' && Object.prototype.hasOwnProperty.call(body, 'code')) {
              if (body.code === 0) {
                resolve(body.data);
              } else {
                const errMsg = body.message || '请求失败';
                if (!options || !options.silent) {
                  wx.showToast({
                    title: errMsg,
                    icon: 'none',
                    duration: 2000
                  });
                }
                reject(new Error(errMsg));
              }
              return;
            }
            resolve(body);
          } else {
            const errMsg = (res.data && res.data.message) || '请求失败';
            if (!options || !options.silent) {
              wx.showToast({
                title: errMsg,
                icon: 'none',
                duration: 2000
              });
            }
            reject(new Error(errMsg));
          }
        },
        fail(err) {
          if (!options || !options.silent) {
            wx.showToast({
              title: '网络异常，请检查网络连接',
              icon: 'none',
              duration: 2000
            });
          }
          reject(err);
        }
      });
    });
  },

  /**
   * GET 请求
   */
  get(url, data, options) {
    return this._request('GET', url, data, options);
  },

  /**
   * POST 请求
   */
  post(url, data) {
    return this._request('POST', url, data);
  },

  /**
   * PUT 请求
   */
  put(url, data) {
    return this._request('PUT', url, data);
  },

  /**
   * DELETE 请求
   */
  delete(url, data) {
    return this._request('DELETE', url, data);
  }
};

module.exports = request;
