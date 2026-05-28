const request = require('../../utils/request');
const constants = require('../../utils/constants');

Page({
  data: {
    messages: [],
    loaded: false,
    inputContent: '',
    sending: false,
    scrollToView: ''
  },

  onLoad() {
    this.loadConversation();
  },

  onShow() {
    this.loadConversation();
  },

  loadConversation() {
    const that = this;
    request.get(constants.API.MESSAGE_SUPPORT_CONVERSATION)
      .then((res) => {
        const msgs = res.messages || [];
        that.setData({
          messages: msgs.map(m => that.formatMessage(m)),
          loaded: true,
          scrollToView: msgs.length > 0 ? 'msg-' + (msgs.length - 1) : ''
        });
      })
      .catch(() => {
        that.setData({ loaded: true });
      });
  },

  formatMessage(msg) {
    const isStaff = msg.senderType === 'staff';
    return {
      id: msg.id,
      title: msg.title,
      content: msg.content,
      messageType: msg.messageType,
      senderType: msg.senderType,
      isStaff: isStaff,
      senderLabel: isStaff ? '我' : '客服',
      time: this.formatTime(msg.createdAt),
      createdAt: msg.createdAt,
      styleClass: isStaff ? 'msg-right' : 'msg-left'
    };
  },

  onInputChange(e) {
    this.setData({ inputContent: e.detail.value });
  },

  sendMessage() {
    const content = (this.data.inputContent || '').trim();
    if (!content) {
      wx.showToast({ title: '请输入消息内容', icon: 'none' });
      return;
    }
    if (content.length > 1000) {
      wx.showToast({ title: '消息最多1000字', icon: 'none' });
      return;
    }

    const that = this;
    this.setData({ sending: true });

    request.post(constants.API.MESSAGE_SUPPORT_SEND, {
      content: content
    }).then((res) => {
      const newMsg = that.formatMessage(res);
      const messages = that.data.messages.concat([newMsg]);
      that.setData({
        messages: messages,
        inputContent: '',
        scrollToView: 'msg-' + (messages.length - 1)
      });
    }).catch(() => {
      // request wrapper already shows toast
    }).finally(() => {
      that.setData({ sending: false });
    });
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
      return '昨天 ' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
    } else {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return month + '-' + day + ' ' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
    }
  }
});
