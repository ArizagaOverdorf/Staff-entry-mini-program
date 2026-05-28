const request = require('../../utils/request');
const constants = require('../../utils/constants');

Page({
  data: {
    title: '',
    content: '',
    submitting: false
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  submit() {
    const title = (this.data.title || '').trim();
    const content = (this.data.content || '').trim();

    if (!title) {
      wx.showToast({ title: '请输入标题', icon: 'none' });
      return;
    }
    if (title.length > 100) {
      wx.showToast({ title: '标题最多100字', icon: 'none' });
      return;
    }
    if (!content) {
      wx.showToast({ title: '请输入咨询内容', icon: 'none' });
      return;
    }
    if (content.length > 1000) {
      wx.showToast({ title: '内容最多1000字', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    const that = this;
    request.post(constants.API.MESSAGE_SUPPORT, {
      title: title,
      content: content
    }).then(() => {
      wx.showToast({ title: '发送成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    }).catch(() => {
      // request wrapper already shows toast
    }).finally(() => {
      that.setData({ submitting: false });
    });
  }
});
