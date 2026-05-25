const request = require('../../utils/request');
const constants = require('../../utils/constants');

Page({
  data: {
    messages: [],
    loaded: false,
    page: 1,
    hasMore: false,
    totalUnread: 0
  },

  onLoad() {
    this.loadMessages(1);
    this.loadUnreadCount();
  },

  onShow() {
    this.loadMessages(1);
    this.loadUnreadCount();
  },

  loadMessages(page) {
    const that = this;
    request.get(constants.API.MESSAGES, { page: page, pageSize: 20 }).then((res) => {
      const list = res.list || res.messages || [];
      that.setData({
        messages: page === 1 ? list : that.data.messages.concat(list),
        loaded: true,
        page: page,
        hasMore: page < (res.totalPages || 1)
      });
    }).catch(() => {
      that.setData({ loaded: true });
    });
  },

  loadUnreadCount() {
    const that = this;
    request.get(constants.API.MESSAGE_UNREAD_COUNT).then((res) => {
      that.setData({
        totalUnread: res.unreadCount || res.count || 0
      });
    }).catch(() => {});
  },

  // 查看消息详情
  viewDetail(e) {
    const msg = e.currentTarget.dataset.item || {};
    // 标记为已读
    this.markAsRead(msg.id);
    wx.navigateTo({
      url: '/pages/message/detail?id=' + msg.id
    });
  },

  markAsRead(id) {
    request.post(constants.API.MESSAGES + '/' + id + '/read').then(() => {
      // 更新本地状态
      const messages = this.data.messages.map(m => {
        if (m.id === id) {
          return { ...m, status: 'read' };
        }
        return m;
      });
      this.setData({ messages: messages });
    }).catch(() => {});
  },

  // 标记全部已读
  markAllRead() {
    request.post(constants.API.MESSAGE_READ, { all: true }).then(() => {
      const messages = this.data.messages.map(m => {
        return { ...m, status: 'read' };
      });
      this.setData({
        messages: messages,
        totalUnread: 0
      });
      wx.showToast({ title: '已全部标记为已读', icon: 'none' });
    }).catch(() => {});
  },

  onReachBottom() {
    if (this.data.hasMore) {
      this.loadMessages(this.data.page + 1);
    }
  },

  formatTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const oneDay = 24 * 60 * 60 * 1000;

    if (diff < oneDay) {
      const h = String(date.getHours()).padStart(2, '0');
      const m = String(date.getMinutes()).padStart(2, '0');
      return h + ':' + m;
    } else if (diff < 2 * oneDay) {
      return '昨天';
    } else {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return month + '-' + day;
    }
  }
});
