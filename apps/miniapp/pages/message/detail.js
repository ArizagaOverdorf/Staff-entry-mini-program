const request = require('../../utils/request');
const constants = require('../../utils/constants');

Page({
  data: {
    id: '',
    message: null,
    loaded: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id });
      this.loadDetail(options.id);
    }
  },

  loadDetail(id) {
    const that = this;
    request.get(constants.API.MESSAGES + '/' + id).then((res) => {
      const msg = res.message || res;
      that.setData({
        message: msg,
        loaded: true
      });
    }).catch(() => {
      that.setData({ loaded: true });
    });
  },

  formatTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return y + '-' + m + '-' + d + ' ' + h + ':' + min;
  }
});
