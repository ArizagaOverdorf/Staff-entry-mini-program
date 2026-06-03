const request = require('../../utils/request');
const constants = require('../../utils/constants');

Page({
  data: {
    messages: [],
    loaded: false,
    page: 1,
    hasMore: false,
    totalUnread: 0,
    auditSummary: null,
    // Support conversation summary
    supportSummary: null
  },

  onLoad() {
    this.loadMessages(1);
    this.loadUnreadCount();
    this.loadAuditSummary();
    this.loadSupportSummary();
  },

  onShow() {
    this.loadMessages(1);
    this.loadUnreadCount();
    this.loadAuditSummary();
    this.loadSupportSummary();
  },

  loadAuditSummary() {
    const that = this;
    request.get(constants.API.INTAKE_STATUS).then((res) => {
      const status = res.intakeStatus || constants.INTAKE_STATUS.DRAFT;
      that.setData({
        auditSummary: {
          status,
          statusLabel: constants.INTAKE_STATUS_LABEL[status] || '未知',
          title: '个人资料审核进度',
          preview: that.getAuditPreview(status),
          updatedAt: res.submittedAt || res.reviewedAt || ''
        }
      });
    }).catch(() => {});
  },

  getAuditPreview(status) {
    if (status === constants.INTAKE_STATUS.PENDING_REVIEW) {
      return '资料已提交，平台正在审核，点击查看详细信息';
    }
    if (status === constants.INTAKE_STATUS.APPROVED) {
      return '入驻审核已通过，点击查看详细信息';
    }
    if (status === constants.INTAKE_STATUS.REJECTED) {
      return '资料被驳回，点击查看原因和证件明细';
    }
    if (status === constants.INTAKE_STATUS.INFO_REQUIRED) {
      return '需要补充资料，点击查看详细信息';
    }
    return '点击查看个人资料和证件审核进度';
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

  goToAudit() {
    wx.navigateTo({
      url: '/pages/audit/status'
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
