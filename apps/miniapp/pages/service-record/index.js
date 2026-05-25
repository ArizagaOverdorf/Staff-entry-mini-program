const request = require('../../utils/request');
const constants = require('../../utils/constants');

Page({
  data: {
    records: [],
    totalPages: 1,
    currentPage: 1,
    loaded: false,
    hasMore: false
  },

  onLoad() {
    this.loadRecords(1);
  },

  loadRecords(page) {
    const that = this;
    request.get(constants.API.SERVICE_RECORDS, { page: page, pageSize: 10 }).then((res) => {
      const list = res.list || res.records || [];
      that.setData({
        records: page === 1 ? list : that.data.records.concat(list),
        totalPages: res.totalPages || 1,
        currentPage: page,
        loaded: true,
        hasMore: page < (res.totalPages || 1)
      });
    }).catch(() => {
      that.setData({ loaded: true });
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadRecords(this.data.currentPage + 1);
    }
  },

  // 查看详情（占位）
  viewDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.showToast({
      title: '服务记录详情',
      icon: 'none'
    });
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }
});
