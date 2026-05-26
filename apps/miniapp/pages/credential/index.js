const request = require('../../utils/request');
const constants = require('../../utils/constants');

Page({
  data: {
    credentials: [],
    loaded: false,
    educationCredentials: []
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
      const educationCredentials = list.filter(
        c => (c.typeId || c.credentialType) === 'education' || (c.typeId || c.credentialType) === 'student_card'
      );
      that.setData({
        credentials: list,
        educationCredentials,
        loaded: true
      });
    }).catch(() => {
      that.setData({ loaded: true });
    });
  },

  // 上传学历/学生证
  goToEducationUpload(e) {
    const typeId = e.currentTarget.dataset.type || 'education';
    const typeName = typeId === 'student_card' ? '学生证' : '学历/毕业证';
    wx.navigateTo({
      url: `/pages/credential/edit/index?typeId=${typeId}&typeName=${encodeURIComponent(typeName)}`
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
      pending: 'tag-warning',
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
