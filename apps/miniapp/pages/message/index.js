const request = require('../../utils/request');
const constants = require('../../utils/constants');

Page({
  data: {
    messages: [],
    loaded: false,
    page: 1,
    hasMore: false,
    totalUnread: 0,
    // Support conversation summary
    supportSummary: null
  },

  onLoad() {
    this.loadMessages(1);
    this.loadUnreadCount();
    this.loadSupportSummary();
  },

  onShow() {
    this.loadMessages(1);
    this.loadUnreadCount();
    this.loadSupportSummary();
  },

  loadSupportSummary() {
    const that = this;
    request.get(constants.API.MESSAGE_SUPPORT_SUMMARY).then((res) => {
      that.setData({ supportSummary: that.normalizeSupportSummary(res) });
      // Update unread count to include support unread
      that.updateTotalUnread();
    }).catch(() => {
      // Support summary may not exist yet
    });
  },

  normalizeSupportSummary(summary) {
    if (!summary || !summary.latestMessage) return summary;
    const latest = { ...summary.latestMessage };
    latest.previewText = this.formatSupportPreview(latest.content || latest.title || '');
    return { ...summary, latestMessage: latest };
  },

  formatSupportPreview(content) {
    if (!content || typeof content !== 'string') return '';
    const trimmed = content.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.type === 'image') return '[图片]';
        if (parsed.type === 'video') return '[视频]';
      } catch (e) {
        // Not a support media payload.
      }
    }
    return content;
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
      that.updateTotalUnread();
    }).catch(() => {});
  },

  updateTotalUnread() {
    const supportUnread = (this.data.supportSummary && this.data.supportSummary.unreadCount) || 0;
    const regularUnread = this.data.messages.filter(m => m.status === 'unread').length;
    this.setData({
      totalUnread: supportUnread + regularUnread
    });
  },

  // Navigate to support conversation
  goToSupport() {
    wx.navigateTo({
      url: '/pages/message/support'
    });
  },

  // View regular message detail
  viewDetail(e) {
    const msg = e.currentTarget.dataset.item || {};
    this.markAsRead(msg.id);
    wx.navigateTo({
      url: '/pages/message/detail?id=' + msg.id
    });
  },

  markAsRead(id) {
    request.post(constants.API.MESSAGES + '/' + id + '/read').then(() => {
      const messages = this.data.messages.map(m => {
        if (m.id === id) {
          return { ...m, status: 'read' };
        }
        return m;
      });
      this.setData({ messages: messages });
      this.updateTotalUnread();
    }).catch(() => {});
  },

  // Mark all messages as read (regular + support)
  markAllRead() {
    request.post(constants.API.MESSAGE_READ, { all: true }).then(() => {
      const messages = this.data.messages.map(m => {
        return { ...m, status: 'read' };
      });
      // Clear support unread locally since server markAllRead covers all types
      const supportSummary = this.data.supportSummary
        ? { ...this.data.supportSummary, unreadCount: 0 }
        : null;
      this.setData({
        messages: messages,
        totalUnread: 0,
        supportSummary: supportSummary,
      });
      // Refresh from server to stay in sync
      this.loadUnreadCount();
      this.loadSupportSummary();
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
