const request = require('../../utils/request');
const constants = require('../../utils/constants');
const uploadUtil = require('../../utils/upload');

const POLL_INTERVAL = 3000;
const MAX_TEXT_LENGTH = 500;
const IMAGE_MAX_SIZE = 2 * 1024 * 1024;
const VIDEO_MAX_SIZE = 5 * 1024 * 1024;
const FILE_MAX_SIZE = 10 * 1024 * 1024;

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
  _isPolling: false,
  _localMediaMap: {},
  _loadingMediaMap: {},
  _lastMessageSignature: '',
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
      if (this._isPolling || this.data.sending) return;
      this._isPolling = true;
      this.loadConversation(false, true).finally(() => {
        this._isPolling = false;
      });
    }, POLL_INTERVAL);
  },

  stopPolling() {
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
  },

  loadConversation(scrollToBottom, silent) {
    const that = this;
    return request.get(constants.API.MESSAGE_SUPPORT_CONVERSATION, null, { silent: !!silent })
      .then((res) => {
        const msgs = res.messages || [];
        const prevLen = that.data.messages.length;
        const signature = msgs.map((m) => [m.id, m.createdAt, m.content || ''].join('|')).join('||');
        if (signature === that._lastMessageSignature) {
          if (!that.data.loaded) {
            that.setData({ loaded: true });
          }
          return;
        }
        that._lastMessageSignature = signature;
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

  buildPublicPreviewUrl(fileIdOrUrl) {
    if (!fileIdOrUrl) return '';
    const value = String(fileIdOrUrl);
    const userDataPath = wx.env && wx.env.USER_DATA_PATH ? wx.env.USER_DATA_PATH : '';
    if (
      value.indexOf('wxfile://') === 0 ||
      value.indexOf('http://tmp/') === 0 ||
      value.indexOf('file://') === 0 ||
      (userDataPath && value.indexOf(userDataPath) === 0)
    ) {
      return value;
    }
    if (value.indexOf('http://') === 0 || value.indexOf('https://') === 0) {
      return value;
    }
    if (value.indexOf('/api/') === 0) {
      return constants.API_BASE_URL.replace(/\/api$/, '') + value;
    }
    return constants.API_BASE_URL + '/app/files/public/' + value + '/preview';
  },

  getFileType(fileName, mimeType) {
    const name = (fileName || '').toLowerCase();
    const mime = (mimeType || '').toLowerCase();
    if (name.endsWith('.pdf') || mime === 'application/pdf') return 'pdf';
    if (name.endsWith('.doc')) return 'doc';
    if (name.endsWith('.docx')) return 'docx';
    if (name.endsWith('.xls')) return 'xls';
    if (name.endsWith('.xlsx')) return 'xlsx';
    if (name.endsWith('.ppt')) return 'ppt';
    if (name.endsWith('.pptx')) return 'pptx';
    return '';
  },

  formatMessage(msg) {
    const isStaff = msg.senderType === 'staff';
    let displayContent = msg.content || msg.title || '';
    let isMedia = false;
    let mediaType = '';
    let mediaUrl = '';
    let mediaFileId = '';
    let mediaFileName = '';
    let mediaFileType = '';

    // Try to parse JSON content for media messages
    if (displayContent && displayContent.startsWith('{') && displayContent.endsWith('}')) {
      try {
        const parsed = JSON.parse(displayContent);
        if (parsed.type === 'image' || parsed.type === 'video' || parsed.type === 'file') {
          isMedia = true;
          mediaType = parsed.type;
          mediaFileId = parsed.fileId || '';
          mediaFileName = parsed.fileName || '';
          mediaFileType = this.getFileType(mediaFileName, parsed.mimeType);
          mediaUrl = this._localMediaMap[mediaFileId] || this.buildPublicPreviewUrl(parsed.mediaUrl || parsed.url || mediaFileId);
          displayContent = parsed.fileName || (parsed.type === 'image' ? '[图片]' : parsed.type === 'video' ? '[视频]' : '[文件]');
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
      mediaFileId: mediaFileId,
      mediaFileName: mediaFileName,
      mediaFileType: mediaFileType,
      mediaLoadFailed: false
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
    if (this.data.sending) {
      return;
    }
    const content = (this.data.inputContent || '').trim();
    if (!content) {
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
          wx.showToast({ title: '图片不能超过2MB', icon: 'none' });
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
          wx.showToast({ title: '视频不能超过5MB', icon: 'none' });
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

  // Choose document-like file and send as media message
  onChooseFile() {
    this.setData({ showActionSheet: false });
    const that = this;
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
      success(res) {
        const tempFile = res.tempFiles && res.tempFiles[0];
        if (!tempFile) return;
        if (tempFile.size > FILE_MAX_SIZE) {
          wx.showToast({ title: '文件不能超过10MB', icon: 'none' });
          return;
        }
        that.uploadAndSendMedia(tempFile, 'file');
      },
      fail(err) {
        if (err.errMsg && err.errMsg.indexOf('cancel') === -1) {
          wx.showToast({ title: '选择文件失败', icon: 'none' });
        }
      }
    });
  },

  // Upload media file and send as a support JSON message
  uploadAndSendMedia(tempFile, mediaType) {
    const that = this;
    const filePath = tempFile.tempFilePath || tempFile.path;
    const fileName = tempFile.name || (mediaType === 'image' ? '图片消息' : mediaType === 'video' ? '视频消息' : '文件消息');

    if (!filePath) {
      wx.showToast({ title: '文件路径无效', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '上传中...', mask: true });

    uploadUtil.uploadFile(constants.API.FILES_UPLOAD, filePath, 'file', {
      purpose: 'support_media'
    })
      .then((result) => {
        wx.hideLoading();
        // Build a structured placeholder in content for display
        const fileId = result.id || result.fileId || '';
        if (fileId && mediaType !== 'file') {
          that._localMediaMap[fileId] = filePath;
        }
        const mediaUrl = that.buildPublicPreviewUrl(fileId);
        const mediaContent = JSON.stringify({
          type: mediaType,
          fileId: fileId,
          mediaUrl: mediaUrl,
          fileName: fileName,
          mimeType: result.mimeType || tempFile.type || '',
          size: result.size || tempFile.size || 0
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

  onMediaImageError(e) {
    const index = e.currentTarget.dataset.index;
    const fileId = e.currentTarget.dataset.fileId;
    const url = e.currentTarget.dataset.url;
    if (index === undefined || index === null) return;
    if (fileId && url) {
      this.cacheMediaPreview(fileId, url, index);
      return;
    }
    const key = 'messages[' + index + '].mediaLoadFailed';
    this.setData({ [key]: true });
  },

  cacheMediaPreview(fileId, url, index) {
    if (this._localMediaMap[fileId] || this._loadingMediaMap[fileId]) return;
    this._loadingMediaMap[fileId] = true;
    const fs = wx.getFileSystemManager();
    const filePath = wx.env.USER_DATA_PATH + '/support_' + fileId;
    const requestUrl = this.buildPublicPreviewUrl(url);
    wx.request({
      url: requestUrl,
      responseType: 'arraybuffer',
      success: (res) => {
        if (res.statusCode < 200 || res.statusCode >= 300 || !res.data) {
          const key = 'messages[' + index + '].mediaLoadFailed';
          this.setData({ [key]: true });
          return;
        }
        fs.writeFile({
          filePath,
          data: res.data,
          success: () => {
            this._localMediaMap[fileId] = filePath;
            const urlKey = 'messages[' + index + '].mediaUrl';
            const failedKey = 'messages[' + index + '].mediaLoadFailed';
            this.setData({
              [urlKey]: filePath,
              [failedKey]: false
            });
          },
          fail: () => {
            const key = 'messages[' + index + '].mediaLoadFailed';
            this.setData({ [key]: true });
          }
        });
      },
      fail: () => {
        const key = 'messages[' + index + '].mediaLoadFailed';
        this.setData({ [key]: true });
      },
      complete: () => {
        this._loadingMediaMap[fileId] = false;
      }
    });
  },

  onOpenMediaFile(e) {
    const url = e.currentTarget.dataset.url;
    const fileName = e.currentTarget.dataset.fileName || '';
    const fileType = e.currentTarget.dataset.fileType || this.getFileType(fileName, '');
    if (!url) return;
    const requestUrl = this.buildPublicPreviewUrl(url);
    wx.showLoading({ title: '打开中...', mask: true });
    wx.downloadFile({
      url: requestUrl,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const options = {
            filePath: res.tempFilePath,
            showMenu: true
          };
          if (fileType) {
            options.fileType = fileType;
          }
          options.fail = function () {
            wx.showToast({ title: '文件打开失败', icon: 'none' });
          };
          wx.openDocument(options);
        } else {
          wx.showToast({ title: '文件下载失败', icon: 'none' });
        }
      },
      fail() {
        wx.showToast({ title: '文件打开失败', icon: 'none' });
      },
      complete() {
        wx.hideLoading();
      }
    });
  },

  // Preview media image in chat
  onPreviewMedia(e) {
    const url = e.currentTarget.dataset.url;
    const type = e.currentTarget.dataset.type;
    if (!url) return;
    const previewUrl = this.buildPublicPreviewUrl(url);
    if (type === 'image') {
      wx.previewImage({
        urls: [previewUrl],
        current: previewUrl
      });
    } else if (type === 'video' && wx.previewMedia) {
      wx.previewMedia({
        sources: [{ url: previewUrl, type: 'video' }]
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
