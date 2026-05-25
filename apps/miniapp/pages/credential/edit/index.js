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
    skillLevel: '',
    remark: '',
    fileUrl: '',
    fileIds: [],
    status: 'pending',
    isSubmitting: false,
    isEdit: false,
    credTypes: [],
    // Skill linking for skill_cert
    showSkillPicker: false,
    showSkillLevel: false,
    staffSkills: [],
    selectedSkillIds: [],
    selectedSkillNames: []
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id, isEdit: true });
      this.loadCredential(options.id);
    }
    this.loadCredTypes();
    this.loadStaffSkills();
  },

  loadCredential(id) {
    const that = this;
    request.get(constants.API.CREDENTIALS + '/' + id).then((res) => {
      const cred = res.credential || res;
      const isSkillCert = (cred.typeId || cred.credentialType) === 'skill_cert';
      that.setData({
        name: cred.name || '',
        typeName: cred.typeName || '',
        typeId: cred.typeId || cred.credentialType || '',
        expireDate: cred.expireDate || cred.expiryDate || '',
        credentialNumber: cred.credentialNumber || '',
        skillLevel: cred.skillLevel || '',
        remark: cred.remark || '',
        fileUrl: cred.fileUrl || '',
        status: cred.status || 'pending',
        fileIds: cred.files ? cred.files.map(f => f.fileAsset.id) : [],
        showSkillPicker: isSkillCert,
        showSkillLevel: isSkillCert,
        selectedSkillIds: cred.staffSkillIds || [],
        selectedSkillNames: (cred.linkedSkills || []).map(s => s.categoryName)
      });
    }).catch(() => {});
  },

  loadCredTypes() {
    this.setData({
      credTypes: constants.CREDENTIAL_TYPES
    });
  },

  loadStaffSkills() {
    const that = this;
    request.get(constants.API.PROFILE).then((res) => {
      const categories = (res.profile && res.profile.serviceCategories) || [];
      that.setData({
        staffSkills: categories.map(c => ({
          id: c.id,
          categoryId: c.categoryId,
          categoryName: c.categoryName
        }))
      });
    }).catch(() => {});
  },

  onTypeChange(e) {
    const index = parseInt(e.detail.value);
    const type = this.data.credTypes[index];
    const isSkillCert = type.value === 'skill_cert';
    this.setData({
      typeId: type.value,
      typeName: type.label,
      showSkillPicker: isSkillCert,
      showSkillLevel: isSkillCert,
      selectedSkillIds: isSkillCert ? this.data.selectedSkillIds : [],
      selectedSkillNames: isSkillCert ? this.data.selectedSkillNames : []
    });
  },

  onSkillToggle(e) {
    const skillId = e.currentTarget.dataset.id;
    const skillName = e.currentTarget.dataset.name;
    let selectedSkillIds = this.data.selectedSkillIds || [];
    let selectedSkillNames = this.data.selectedSkillNames || [];

    const idx = selectedSkillIds.indexOf(skillId);
    if (idx > -1) {
      selectedSkillIds = selectedSkillIds.filter(id => id !== skillId);
      selectedSkillNames = selectedSkillNames.filter(n => n !== skillName);
    } else {
      selectedSkillIds = [...selectedSkillIds, skillId];
      selectedSkillNames = [...selectedSkillNames, skillName];
    }

    this.setData({
      selectedSkillIds,
      selectedSkillNames
    });
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onNumberInput(e) {
    this.setData({ credentialNumber: e.detail.value });
  },

  onSkillLevelInput(e) {
    this.setData({ skillLevel: e.detail.value });
  },

  onExpireDateInput(e) {
    this.setData({ expireDate: e.detail.value });
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  // 选择并上传图片（两步：先上传文件，获得 fileId 后关联到证件）
  handleUploadImage() {
    const that = this;
    uploadUtil.chooseAndUpload(
      constants.API.FILES_UPLOAD,
      'file'
    ).then((res) => {
      const fileId = res.data?.id || res.id || '';
      const fileUrl = res.data?.fileUrl || res.fileUrl || '';
      if (fileId) {
        const fileIds = that.data.fileIds || [];
        fileIds.push(fileId);
        that.setData({
          fileIds: fileIds,
          fileUrl: fileUrl || fileId
        });
      }
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
    if (!this.data.typeId) {
      wx.showToast({ title: '请选择证件类型', icon: 'none' });
      return;
    }
    if (this.data.typeId === 'skill_cert' && (!this.data.selectedSkillIds || this.data.selectedSkillIds.length === 0)) {
      wx.showToast({ title: '技能证书需关联至少一个服务技能', icon: 'none' });
      return;
    }

    this.setData({ isSubmitting: true });

    const data = {
      name: this.data.name,
      typeId: this.data.typeId,
      typeName: this.data.typeName,
      credentialNumber: this.data.credentialNumber,
      expireDate: this.data.expireDate,
      skillLevel: this.data.skillLevel,
      remark: this.data.remark,
      fileIds: this.data.fileIds
    };

    if (this.data.typeId === 'skill_cert') {
      data.staffSkillIds = this.data.selectedSkillIds;
    }

    const url = this.data.isEdit
      ? constants.API.CREDENTIALS + '/' + this.data.id
      : constants.API.CREDENTIALS;

    const that = this;
    const saveRequest = this.data.isEdit
      ? request.put(url, data)
      : request.post(url, data);

    saveRequest.then(() => {
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
