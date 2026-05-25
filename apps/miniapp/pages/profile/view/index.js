const request = require('../../../utils/request');
const constants = require('../../../utils/constants');

Page({
  data: {
    profile: null,
    loaded: false
  },

  onLoad() {
    this.loadProfile();
  },

  loadProfile() {
    const that = this;
    request.get(constants.API.PROFILE).then((res) => {
      that.setData({
        profile: res.profile || res,
        loaded: true
      });
    }).catch(() => {
      that.setData({ loaded: true });
    });
  },

  goToEdit() {
    wx.navigateTo({
      url: '/pages/profile/edit/index'
    });
  },

  getGenderLabel(value) {
    const option = constants.GENDER_OPTIONS.find(g => g.value === value);
    return option ? option.label : '未设置';
  }
});
