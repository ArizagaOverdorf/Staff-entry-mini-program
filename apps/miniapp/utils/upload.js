const constants = require('./constants');
const authUtil = require('./auth');

/**
 * 文件上传工具
 * 封装 wx.uploadFile，自动添加 Bearer token
 */
const upload = {
  /**
   * 上传文件到服务器
   * @param {string} url 上传地址（相对于 baseUrl）
   * @param {string} filePath 文件本地路径
   * @param {string} name 文件字段名
   * @param {object} formData 附加表单数据
   */
  uploadFile(url, filePath, name, formData) {
    const baseUrl = constants.API_BASE_URL;
    const token = authUtil.getToken();

    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: baseUrl + url,
        filePath: filePath,
        name: name || 'file',
        formData: formData || {},
        header: {
          'Authorization': 'Bearer ' + token
        },
        success(res) {
          if (res.statusCode === 401) {
            authUtil.removeToken();
            wx.redirectTo({
              url: '/pages/auth/index'
            });
            reject(new Error('登录已过期'));
            return;
          }

          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const data = JSON.parse(res.data);
              resolve(data);
            } catch (e) {
              resolve(res.data);
            }
          } else {
            let errMsg = '上传失败';
            try {
              const data = JSON.parse(res.data);
              errMsg = data.message || errMsg;
            } catch (e) {
              // ignore parse error
            }
            wx.showToast({
              title: errMsg,
              icon: 'none'
            });
            reject(new Error(errMsg));
          }
        },
        fail(err) {
          wx.showToast({
            title: '上传失败，请检查网络',
            icon: 'none'
          });
          reject(err);
        }
      });
    });
  },

  /**
   * 选择图片并上传
   * @param {string} url 上传地址
   * @param {string} name 文件字段名
   * @param {object} formData 附加数据
   */
  chooseAndUpload(url, name, formData) {
    const that = this;
    return new Promise((resolve, reject) => {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed'],
        success(res) {
          const tempFile = res.tempFiles[0];
          const filePath = tempFile.tempFilePath;

          wx.showLoading({
            title: '上传中...',
            mask: true
          });

          that.uploadFile(url, filePath, name, formData)
            .then((result) => {
              wx.hideLoading();
              resolve(result);
            })
            .catch((err) => {
              wx.hideLoading();
              reject(err);
            });
        },
        fail(err) {
          if (err.errMsg.indexOf('cancel') === -1) {
            wx.showToast({
              title: '选择图片失败',
              icon: 'none'
            });
          }
          reject(err);
        }
      });
    });
  }
};

module.exports = upload;
