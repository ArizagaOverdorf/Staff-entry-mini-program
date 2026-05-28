const request = require('../../../utils/request');
const uploadUtil = require('../../../utils/upload');
const constants = require('../../../utils/constants');

function getCredentialType(typeId) {
  return constants.CREDENTIAL_TYPES.find((item) => item.value === typeId);
}

function getSkillLevelIndex(level) {
  return constants.SKILL_LEVEL_OPTIONS.findIndex((item) => item.value === level);
}

Page({
  data: {
    id: '',
    name: '',
    nameLabel: '证件名称',
    namePlaceholder: '请输入证件名称',
    typeName: '',
    typeId: '',
    expireDate: '',
    credentialNumber: '',
    issuingAuthority: '',
    issuingAuthorityLabel: '签发机构',
    issuingAuthorityPlaceholder: '请输入签发机构',
    skillLevel: '',
    skillLevelIndex: -1,
    skillLevelOptions: constants.SKILL_LEVEL_OPTIONS,
    remark: '',
    fileUrl: '',
    fileIds: [],
    status: 'pending',
    statusLabel: '',
    isSubmitting: false,
    isEdit: false,
    isTypeLocked: false,
    isSkillCert: false,
    showNormalCredentialFields: true,
    credTypes: [],
    staffSkills: [],
    selectedSkillIds: [],
    selectedSkillNames: [],
    selectedSkillText: ''
  },

  onLoad(options) {
    this.loadCredTypes();

    if (options.id) {
      this.setData({ id: options.id, isEdit: true });
      this.loadCredential(options.id);
    } else if (options.typeId) {
      const typeId = options.typeId;
      const matchedType = getCredentialType(typeId);
      const typeName = options.typeName
        ? decodeURIComponent(options.typeName)
        : matchedType
          ? matchedType.label
          : '';

      this.applyTypeState(typeId, typeName, true);
    } else {
      this.refreshSkillOptions([]);
    }
  },

  applyTypeState(typeId, typeName, isLocked) {
    const isSkillCert = typeId === 'skill_cert';
    const isEducation = typeId === 'education' || typeId === 'student_card';
    const requireExpiry = constants.CREDENTIAL_TYPES_REQUIRE_EXPIRY.indexOf(typeId) > -1;

    this.setData({
      typeId,
      typeName,
      name: isSkillCert ? '' : (this.data.name || typeName),
      nameLabel: isSkillCert ? '名称' : '证件名称',
      namePlaceholder: isSkillCert ? '请填写技能证书名称' : '请输入证件名称',
      isTypeLocked: !!isLocked,
      isSkillCert,
      showNormalCredentialFields: !isSkillCert,
      requireExpiry,
      issuingAuthorityLabel: isEducation ? '学校' : '签发机构',
      issuingAuthorityPlaceholder: isEducation ? '请输入学校名称' : '请输入签发机构'
    });

    this.refreshSkillOptions(this.data.selectedSkillIds || []);
  },

  loadCredential(id) {
    request.get(constants.API.CREDENTIALS + '/' + id).then((res) => {
      const cred = res.credential || res;
      const typeId = cred.typeId || cred.credentialType || '';
      const typeName = cred.typeName || (getCredentialType(typeId) || {}).label || '';
      const linkedSkillIds = (cred.linkedSkills || [])
        .map((skill) => skill.categoryId)
        .filter(Boolean);
      const skillLevel = cred.skillLevel || '';

      this.setData({
        name: cred.name || '',
        typeName,
        typeId,
        isTypeLocked: true,
        expireDate: cred.expireDate || cred.expiryDate || '',
        credentialNumber: cred.credentialNumber || '',
        issuingAuthority: cred.issuingAuthority || '',
        skillLevel,
        skillLevelIndex: getSkillLevelIndex(skillLevel),
        remark: cred.remark || '',
        fileUrl: cred.fileUrl || '',
        status: cred.status || 'pending',
        statusLabel: constants.CREDENTIAL_STATUS_LABEL[cred.status] || cred.status || '',
        fileIds: cred.files ? cred.files.map((file) => file.fileAsset.id) : [],
        selectedSkillIds: linkedSkillIds,
        selectedSkillNames: (cred.linkedSkills || []).map((skill) => skill.categoryName)
      });

      this.applyTypeState(typeId, typeName, true);
    }).catch(() => {});
  },

  loadCredTypes() {
    this.setData({
      credTypes: constants.CREDENTIAL_TYPES
    });
  },

  refreshSkillOptions(selectedIds) {
    const selected = selectedIds || [];
    const staffSkills = constants.SERVICE_SKILL_OPTIONS.map((item) => ({
      id: item.value,
      categoryId: item.value,
      categoryName: item.label,
      checked: selected.indexOf(item.value) > -1
    }));
    const selectedSkillNames = staffSkills
      .filter((item) => item.checked)
      .map((item) => item.categoryName);

    this.setData({
      staffSkills,
      selectedSkillIds: selected,
      selectedSkillNames,
      selectedSkillText: selectedSkillNames.join('、')
    });
  },

  onTypeChange(e) {
    if (this.data.isTypeLocked) return;

    const index = parseInt(e.detail.value);
    const type = this.data.credTypes[index];
    if (!type) return;

    this.applyTypeState(type.value, type.label, false);
  },

  onSkillToggle(e) {
    const skillId = e.currentTarget.dataset.id;
    let selectedSkillIds = this.data.selectedSkillIds || [];

    if (selectedSkillIds.indexOf(skillId) > -1) {
      selectedSkillIds = selectedSkillIds.filter((id) => id !== skillId);
    } else {
      selectedSkillIds = [...selectedSkillIds, skillId];
    }

    this.refreshSkillOptions(selectedSkillIds);
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onNumberInput(e) {
    this.setData({ credentialNumber: e.detail.value });
  },

  onIssuingAuthorityInput(e) {
    this.setData({ issuingAuthority: e.detail.value });
  },

  onSkillLevelChange(e) {
    const index = parseInt(e.detail.value);
    const option = this.data.skillLevelOptions[index];
    this.setData({
      skillLevelIndex: index,
      skillLevel: option ? option.value : ''
    });
  },

  onExpireDateInput(e) {
    this.setData({ expireDate: e.detail.value });
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  handleUploadImage() {
    uploadUtil.chooseAndUpload(
      constants.API.FILES_UPLOAD,
      'file'
    ).then((res) => {
      const fileId = res.data?.id || res.id || '';
      const fileUrl = res.data?.fileUrl || res.fileUrl || '';
      if (fileId) {
        const fileIds = this.data.fileIds || [];
        fileIds.push(fileId);
        this.setData({
          fileIds,
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

  getSelectedSkillCategories() {
    return (this.data.selectedSkillIds || []).map((id) => {
      const skill = constants.SERVICE_SKILL_OPTIONS.find((item) => item.value === id);
      return {
        categoryId: id,
        categoryName: skill ? skill.label : id
      };
    });
  },

  validate() {
    if (!this.data.typeId) {
      wx.showToast({ title: '请选择证件类型', icon: 'none' });
      return false;
    }
    if (!this.data.name) {
      wx.showToast({
        title: this.data.isSkillCert ? '请输入名称' : '请输入证件名称',
        icon: 'none'
      });
      return false;
    }
    if (this.data.requireExpiry && !this.data.expireDate) {
      wx.showToast({ title: '请填写有效期', icon: 'none' });
      return false;
    }
    if (this.data.requireExpiry && this.data.expireDate && isNaN(Date.parse(this.data.expireDate))) {
      wx.showToast({ title: '有效期日期格式无效', icon: 'none' });
      return false;
    }
    if (this.data.isSkillCert && !this.data.skillLevel) {
      wx.showToast({ title: '请选择等级', icon: 'none' });
      return false;
    }
    if (this.data.isSkillCert && (!this.data.selectedSkillIds || this.data.selectedSkillIds.length === 0)) {
      wx.showToast({ title: '技能证书需关联至少一个服务技能', icon: 'none' });
      return false;
    }
    return true;
  },

  handleSave() {
    if (this.data.isSubmitting) return;
    if (!this.validate()) return;

    this.setData({ isSubmitting: true });

    const data = {
      name: this.data.name,
      typeId: this.data.typeId,
      typeName: this.data.typeName,
      remark: this.data.remark,
      fileIds: this.data.fileIds
    };

    if (this.data.isSkillCert) {
      data.skillLevel = this.data.skillLevel;
      data.staffSkillCategories = this.getSelectedSkillCategories();
    } else {
      data.credentialNumber = this.data.credentialNumber;
      data.issuingAuthority = this.data.issuingAuthority;
      data.expireDate = this.data.expireDate;
    }

    const url = this.data.isEdit
      ? constants.API.CREDENTIALS + '/' + this.data.id
      : constants.API.CREDENTIALS;

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
      this.setData({ isSubmitting: false });
    });
  }
});
