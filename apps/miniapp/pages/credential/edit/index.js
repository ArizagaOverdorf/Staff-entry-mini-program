const request = require('../../../utils/request');
const uploadUtil = require('../../../utils/upload');
const constants = require('../../../utils/constants');

Page({
  data: {
    id: '',
    name: '',
    typeName: '',
    typeId: '',
    expireDate: '',
    credentialNumber: '',
    remark: '',
    fileUrl: '',
    filePath: '',
    status: 'pending',
    isSubmitting: false,
    isEdit: false,
    credTypes: []
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id, isEdit: true });
      this.loadCredential(options.id);
    }
    this.loadCredTypes();
  },

  loadCredential(id) {
    const that = this;
    request.get(constants.API.CREDENTIALS + '/' + id).then((res) => {
      const cred = res.credential || res;
      that.setData({
        name: cred.name || '',
        typeName: cred.typeName || '',
        typeId: cred.typeId || '',
        expireDate: cred.expireDate || '',
        credentialNumber: cred.credentialNumber || '',
        remark: cred.remark || '',
        fileUrl: cred.fileUrl || '',
        status: cred.status || 'pending',
        statusLabel: constants.CREDENTIAL_STATUS_LABEL[cred.status] || '待上传'
      });
    }).catch(() => {});
  },

  loadCredTypes() {
    // 从字典加载证件类型
    // 实际项目中需要从 API 获取
    this.setData({
      credTypes: [
        { value: 'id_card', label: '身份证' },
        { value: 'health_cert', label: '健康证' },
        { value: 'skill_cert', label: '技能证书' },
        { value: 'other', label: '其他' }
      ]
    });
  },

  // 证件类型选择
  onTypeChange(e) {
    const index = parseInt(e.detail.value);
    const type = this.data.credTypes[index];
    this.setData({
      typeId: type.value,
      typeName: type.label
    });
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onNumberInput(e) {
    this.setData({ credentialNumber: e.detail.value });
  },

  onExpireDateInput(e) {
    this.setData({ expireDate: e.detail.value });
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  // 选择并上传图片
  handleUploadImage() {
    const that = this;
    uploadUtil.chooseAndUpload(
      constants.API.CREDENTIAL_UPLOAD,
      'file',
      { typeId: this.data.typeId }
    ).then((res) => {
      that.setData({
        fileUrl: res.url || res.fileUrl || '',
        filePath: res.path || ''
      });
      wx.showToast({
        title: '上传成功',
        icon: 'success'
      });
    }).catch((err) => {
      console.error('上传失败', err);
    });
  },

  // 保存
  handleSave() {
    if (this.data.isSubmitting) return;

    if (!this.data.name) {
      wx.showToast({ title: '请输入证件名称', icon: 'none' });
      return;
    }
    if (!this.data.fileUrl && !this.data.filePath) {
      wx.showToast({ title: '请上传证件图片', icon: 'none' });
      return;
    }

    this.setData({ isSubmitting: true });

    const data = {
      name: this.data.name,
      typeId: this.data.typeId,
      typeName: this.data.typeName,
      credentialNumber: this.data.credentialNumber,
      expireDate: this.data.expireDate,
      remark: this.data.remark,
      fileUrl: this.data.fileUrl
    };

    const url = this.data.isEdit
      ? constants.API.CREDENTIALS + '/' + this.data.id
      : constants.API.CREDENTIALS;

    const method = this.data.isEdit ? request.put : request.post;

    const that = this;
    method(url, data).then(() => {
      wx.showToast({
        title: '保存成功',
        icon: 'success',
        duration: 1500
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }).catch((err) => {
      console.error('保存证件失败', err);
    }).finally(() => {
      that.setData({ isSubmitting: false });
    });
  }
});
