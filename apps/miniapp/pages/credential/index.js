const request = require('../../utils/request');
const constants = require('../../utils/constants');

Page({
  data: {
    credentials: [],
    loaded: false
  },

  onLoad() {
    this.loadCredentials();
  },

  onShow() {
    this.loadCredentials();
  },

  loadCredentials() {
    const that = this;
    request.get(constants.API.CREDENTIALS).then((res) => {
      const list = res.list || res.credentials || [];
      that.setData({
        credentials: list,
        loaded: true
      });
    }).catch(() => {
      that.setData({ loaded: true });
    });
  },

  // 上传新证件
  goToUpload() {
    wx.navigateTo({
      url: '/pages/credential/edit/index'
    });
  },

  // 编辑证件
  goToEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/credential/edit/index?id=' + id
    });
  },

  getStatusClass(status) {
    const map = {
      pending: 'tag-info',
      uploaded: 'tag-warning',
      approved: 'tag-success',
      rejected: 'tag-error',
      expired: 'tag-error'
    };
    return map[status] || 'tag-info';
  },

  getStatusLabel(status) {
    return constants.CREDENTIAL_STATUS_LABEL[status] || status;
  }
});
