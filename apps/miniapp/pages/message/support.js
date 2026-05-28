const request = require('../../utils/request');
const constants = require('../../utils/constants');
const uploadUtil = require('../../utils/upload');

const POLL_INTERVAL = 5000;
const MAX_TEXT_LENGTH = 500;
const IMAGE_MAX_SIZE = 3 * 1024 * 1024;
const VIDEO_MAX_SIZE = 10 * 1024 * 1024;

Page({
  data: {
    messages: [],
    loaded: false,
    inputContent: '',
    sending: false,
    scrollToView: '',
    textareaHeight: 40,
    inputBarFocus: false,
    showActionSheet: false
  },

  _pollTimer: null,
  _locked: false,

  onLoad() {
    this.loadConversation();
  },

  onShow() {
    this.startPolling();
    this.loadConversation();
  },

  onHide() {
    this.stopPolling();
  },

  onUnload() {
    this.stopPolling();
  },

  startPolling() {
    if (this._pollTimer) return;
    this._pollTimer = setInterval(() => {
      this.loadConversation(false);
    }, POLL_INTERVAL);
  },

  stopPolling() {
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
  },

  loadConversation(scrollToBottom) {
    const that = this;
    request.get(constants.API.MESSAGE_SUPPORT_CONVERSATION)
      .then((res) => {
        const msgs = res.messages || [];
        const prevLen = that.data.messages.length;
        const hasNew = msgs.length > prevLen;
        const shouldScroll = scrollToBottom !== false && (hasNew || prevLen === 0);
        that.setData({
          messages: msgs.map(m => that.formatMessage(m)),
          loaded: true,
          scrollToView: shouldScroll && msgs.length > 0 ? 'msg-' + (msgs.length - 1) : ''
        });
      })
      .catch(() => {
        that.setData({ loaded: true });
      });
  },

  formatMessage(msg) {
    const isStaff = msg.senderType === 'staff';
    let displayContent = msg.content || msg.title || '';
    let isMedia = false;
    let mediaType = '';
    let mediaUrl = '';
    let mediaFileId = '';

    // Try to parse JSON content for media messages
    if (displayContent && displayContent.startsWith('{') && displayContent.endsWith('}')) {
      try {
        const parsed = JSON.parse(displayContent);
        if (parsed.type === 'image' || parsed.type === 'video') {
          isMedia = true;
          mediaType = parsed.type;
          mediaFileId = parsed.fileId || parsed.url || '';
          mediaUrl = mediaFileId ? constants.API_BASE_URL + '/app/files/public/' + mediaFileId + '/preview' : '';
          displayContent = parsed.fileName || (parsed.type === 'image' ? '[图片]' : '[视频]');
        }
      } catch (e) {
        // Not JSON, use as plain text
      }
    }

    return {
      id: msg.id,
      title: msg.title,
      content: msg.content,
      displayContent: displayContent,
      messageType: msg.messageType,
      senderType: msg.senderType,
      isStaff: isStaff,
      senderLabel: isStaff ? '我' : '客服',
      time: this.formatTime(msg.createdAt),
      createdAt: msg.createdAt,
      styleClass: isStaff ? 'msg-right' : 'msg-left',
      isMedia: isMedia,
      mediaType: mediaType,
      mediaUrl: mediaUrl,
      mediaFileId: mediaFileId
    };
  },

  onInputChange(e) {
    const value = e.detail.value || '';
    this.setData({ inputContent: value });
  },

  onTextareaLineChange(e) {
    const lineHeight = 22;
    const minHeight = 40;
    const maxHeight = 120;
    let height = e.detail.height || minHeight;
    height = Math.max(minHeight, Math.min(maxHeight, height));
    this.setData({ textareaHeight: height });
  },

  onInputFocus() {
    this.setData({ inputBarFocus: true });
  },

  onInputBlur() {
    this.setData({ inputBarFocus: false });
  },

  sendMessage() {
    const content = (this.data.inputContent || '').trim();
    if (!content) {
      wx.showToast({ title: '请输入消息内容', icon: 'none' });
      return;
    }
    if (content.length > MAX_TEXT_LENGTH) {
      wx.showToast({ title: '消息最多500字', icon: 'none' });
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
        scrollToView: 'msg-' + (messages.length - 1),
        textareaHeight: 40
      });
    }).catch(() => {
      // request wrapper already shows toast
    }).finally(() => {
      that.setData({ sending: false });
    });
  },

  // Voice button placeholder
  onTapVoice() {
    wx.showToast({ title: '语音输入暂未开放', icon: 'none' });
  },

  // Plus button - show action sheet
  onTapPlus() {
    this.setData({ showActionSheet: true });
  },

  onCloseActionSheet() {
    this.setData({ showActionSheet: false });
  },

  // Choose image and send as media message
  onChooseImage() {
    this.setData({ showActionSheet: false });
    const that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['original', 'compressed'],
      success(res) {
        const tempFile = res.tempFiles[0];
        if (tempFile.size > IMAGE_MAX_SIZE) {
          wx.showToast({ title: '图片不能超过3MB', icon: 'none' });
          return;
        }
        that.uploadAndSendMedia(tempFile, 'image');
      },
      fail(err) {
        if (err.errMsg && err.errMsg.indexOf('cancel') === -1) {
          wx.showToast({ title: '选择图片失败', icon: 'none' });
        }
      }
    });
  },

  // Choose video and send as media message
  onChooseVideo() {
    this.setData({ showActionSheet: false });
    const that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['video'],
      sourceType: ['album', 'camera'],
      success(res) {
        const tempFile = res.tempFiles[0];
        if (tempFile.size > VIDEO_MAX_SIZE) {
          wx.showToast({ title: '视频不能超过10MB', icon: 'none' });
          return;
        }
        that.uploadAndSendMedia(tempFile, 'video');
      },
      fail(err) {
        if (err.errMsg && err.errMsg.indexOf('cancel') === -1) {
          wx.showToast({ title: '选择视频失败', icon: 'none' });
        }
      }
    });
  },

  // Upload media file and send as a support JSON message
  uploadAndSendMedia(tempFile, mediaType) {
    const that = this;
    const fileName = mediaType === 'image' ? '图片消息' : '视频消息';

    wx.showLoading({ title: '上传中...', mask: true });

    uploadUtil.uploadFile(constants.API.FILES_UPLOAD, tempFile.tempFilePath, 'file', {
      purpose: 'support_media'
    })
      .then((result) => {
        wx.hideLoading();
        // Build a structured placeholder in content for display
        const fileId = result.id || result.fileId || '';
        const mediaContent = JSON.stringify({
          type: mediaType,
          fileId: fileId,
          fileName: fileName
        });

        that.setData({ sending: true });
        return request.post(constants.API.MESSAGE_SUPPORT_SEND, {
          content: mediaContent
        });
      })
      .then((res) => {
        const newMsg = that.formatMessage(res);
        const messages = that.data.messages.concat([newMsg]);
        that.setData({
          messages: messages,
          inputContent: '',
          scrollToView: 'msg-' + (messages.length - 1),
          textareaHeight: 40
        });
      })
      .catch(() => {
        // upload or send failed, wrapper already shows toast
      })
      .finally(() => {
        that.setData({ sending: false });
        wx.hideLoading();
      });
  },

  // Preview media image in chat
  onPreviewMedia(e) {
    const url = e.currentTarget.dataset.url;
    const type = e.currentTarget.dataset.type;
    if (!url) return;
    if (type === 'image') {
      wx.previewImage({
        urls: [url],
        current: url
      });
    } else {
      wx.showToast({ title: '视频预览暂未开放', icon: 'none' });
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
      return '昨天 ' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
    } else {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return month + '-' + day + ' ' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
    }
  }
});
