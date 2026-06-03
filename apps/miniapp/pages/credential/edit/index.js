const request = require('../../../utils/request');
const uploadUtil = require('../../../utils/upload');
const constants = require('../../../utils/constants');
const authUtil = require('../../../utils/auth');

function buildPrivatePreviewUrl(fileId) {
  return constants.API_BASE_URL + '/app/files/' + fileId + '/preview';
}

function getCredentialType(typeId) {
  return constants.CREDENTIAL_TYPES.find((item) => item.value === typeId);
}

function getSkillLevelIndex(level) {
  return constants.SKILL_LEVEL_OPTIONS.findIndex((item) => item.value === level);
}

function getOptionIndex(options, value) {
  return options.findIndex((item) => item.value === value);
}

const CREDENTIAL_IMAGE_REQUIRED_TYPES = [
  'health_cert',
  'no_crime_cert',
  'credit_report',
  'medical_report',
  'insurance',
  'education',
  'student_card',
  'other'
];

Page({
  data: {
    id: '',
    name: '',
    nameLabel: '证件名称',
    namePlaceholder: '请输入证件名称',
    typeName: '',
    typeId: '',
    expireDate: '',
    issueDate: '',
    issueDateLabel: '签发日期',
    issueDatePlaceholder: '请选择签发日期',
    expireDateLabel: '有效期至',
    expireDatePlaceholder: '请选择有效期至',
    todayDate: '',
    requireIssueDate: false,
    credentialNumber: '',
    credentialNumberLabel: '证件编号',
    credentialNumberPlaceholder: '请输入证件编号',
    idNumberRequired: false,
    issuingAuthority: '',
    issuingAuthorityLabel: '签发机构',
    issuingAuthorityPlaceholder: '请输入签发机构',
    educationLevelOptions: constants.EDUCATION_LEVEL_OPTIONS,
    educationLevelIndex: -1,
    insuranceCompanyOptions: constants.INSURANCE_COMPANY_OPTIONS,
    insuranceCompanyIndex: -1,
    insuranceCompanyOther: '',
    skillLevel: '',
    skillLevelIndex: -1,
    skillLevelOptions: constants.SKILL_LEVEL_OPTIONS,
    remark: '',
    fileUrl: '',
    fileIds: [],
    fileSides: [],
    // ID card dual-upload slots
    isIdCard: false,
    idCardFrontFileId: '',
    idCardFrontUrl: '',
    idCardBackFileId: '',
    idCardBackUrl: '',
    status: 'pending',
    statusLabel: '',
    isSubmitting: false,
    isEdit: false,
    isTypeLocked: false,
    isSkillCert: false,
    showNormalCredentialFields: true,
    showNameField: true,
    useEducationLevelPicker: false,
    showCredentialNumber: true,
    showIssuingAuthority: true,
    showInsuranceCompanyPicker: false,
    showInsuranceCompanyOther: false,
    imageRequired: false,
    showIssueDate: false,
    showExpireDate: false,
    idCardKeyboardActive: false,
    credTypes: [],
    staffSkills: [],
    selectedSkillIds: [],
    selectedSkillNames: [],
    selectedSkillText: ''
  },

  onLoad(options) {
    const today = new Date();
    const todayStr = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');
    this.setData({ todayDate: todayStr });

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

      // Prefill ID number from profile when creating new ID card credential
      if (typeId === 'id_card') {
        this.prefillProfileIdNumber();
      }
    } else {
      this.refreshSkillOptions([]);
    }
  },

  prefillProfileIdNumber() {
    request.get(constants.API.PROFILE).then((res) => {
      const profile = res.profile || {};
      if (profile.idNumber) {
        this.setData({ credentialNumber: profile.idNumber });
      }
    }).catch(() => {
      // Profile not available — leave empty
    });
  },

  applyTypeState(typeId, typeName, isLocked) {
    const isSkillCert = typeId === 'skill_cert';
    const isIdCard = typeId === 'id_card';
    const isEducation = typeId === 'education';
    const isStudentCard = typeId === 'student_card';
    const isInsurance = typeId === 'insurance';
    const imageRequired = CREDENTIAL_IMAGE_REQUIRED_TYPES.indexOf(typeId) > -1 || isSkillCert;
    const requireExpiry = constants.CREDENTIAL_TYPES_REQUIRE_EXPIRY.indexOf(typeId) > -1;
    const requireIssueDate = constants.CREDENTIAL_TYPES_REQUIRE_ISSUE_DATE.indexOf(typeId) > -1;
    const issueOnlyTypes = constants.CREDENTIAL_TYPES_REQUIRE_ISSUE_DATE || [];
    const useEducationLevelPicker = isEducation || isStudentCard;
    const showCredentialNumber = ![
      'education',
      'student_card',
      'credit_report',
      'health_cert',
      'no_crime_cert',
      'medical_report'
    ].includes(typeId);
    const showIssuingAuthority = ![
      'credit_report',
      'health_cert',
      'no_crime_cert'
    ].includes(typeId);
    const showIssueDate = requireExpiry || issueOnlyTypes.includes(typeId);
    const showExpireDate = requireExpiry;
    const issuingAuthorityValue = this.data.issuingAuthority || '';
    const rawInsuranceCompanyIndex = isInsurance
      ? getOptionIndex(constants.INSURANCE_COMPANY_OPTIONS, issuingAuthorityValue)
      : -1;
    const otherInsuranceCompanyIndex = getOptionIndex(constants.INSURANCE_COMPANY_OPTIONS, '其他');
    const insuranceCompanyIndex = isInsurance
      ? (rawInsuranceCompanyIndex > -1
        ? rawInsuranceCompanyIndex
        : issuingAuthorityValue
          ? otherInsuranceCompanyIndex
          : 0)
      : -1;
    const selectedInsuranceCompany = isInsurance ? constants.INSURANCE_COMPANY_OPTIONS[insuranceCompanyIndex] : null;
    const insuranceCompanyOther = isInsurance && issuingAuthorityValue && rawInsuranceCompanyIndex === -1
      ? issuingAuthorityValue
      : this.data.insuranceCompanyOther;

    this.setData({
      typeId,
      typeName,
      name: isSkillCert ? '' : (this.data.name || (useEducationLevelPicker ? '' : typeName)),
      nameLabel: isSkillCert ? '名称' : (isEducation ? '学历' : isStudentCard ? '学历水平' : '证件名称'),
      namePlaceholder: isSkillCert
        ? '请填写技能证书名称'
        : (useEducationLevelPicker ? '请选择学历水平' : '请输入证件名称'),
      isTypeLocked: !!isLocked,
      isSkillCert,
      isIdCard,
      idNumberRequired: isIdCard,
      showNormalCredentialFields: !isSkillCert && !isIdCard,
      showNameField: !isIdCard,
      useEducationLevelPicker,
      educationLevelIndex: useEducationLevelPicker ? getOptionIndex(constants.EDUCATION_LEVEL_OPTIONS, this.data.name) : -1,
      showCredentialNumber,
      credentialNumberLabel: isInsurance ? '保险单号' : '证件编号',
      credentialNumberPlaceholder: isInsurance ? '请输入保险单号' : '请输入证件编号',
      showIssuingAuthority,
      issuingAuthorityLabel: isInsurance ? '保险公司' : (isEducation || isStudentCard ? '专业' : '签发机构'),
      issuingAuthorityPlaceholder: isInsurance ? '请选择保险公司' : (isEducation || isStudentCard ? '请输入专业' : '请输入签发机构'),
      showInsuranceCompanyPicker: isInsurance,
      insuranceCompanyIndex: isInsurance ? insuranceCompanyIndex : -1,
      showInsuranceCompanyOther: isInsurance && !!selectedInsuranceCompany && selectedInsuranceCompany.value === '其他',
      insuranceCompanyOther,
      imageRequired,
      requireExpiry,
      requireIssueDate,
      showIssueDate,
      showExpireDate,
      issueDateLabel: isInsurance ? '生效日期' : '签发日期',
      issueDatePlaceholder: isInsurance ? '请选择生效日期' : '请选择签发日期',
      expireDateLabel: isInsurance ? '有效日期' : '有效期至',
      expireDatePlaceholder: isInsurance ? '请选择有效日期' : '请选择有效期至'
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

      // Handle ID card dual upload files
      const files = cred.files || [];
      const idCardFront = files.find((f) => f.fileType === 'front' || f.fileSide === 'front');
      const idCardBack = files.find((f) => f.fileType === 'back' || f.fileSide === 'back');
      const otherFiles = files.filter((f) =>
        f.fileType !== 'front' && f.fileSide !== 'front' &&
        f.fileType !== 'back' && f.fileSide !== 'back'
      );
      const flatFileIds = files.map((f) => f.fileAsset.id);
      const flatFileSides = files.map((f) => f.fileType || f.fileSide || 'credential_image');

      this.setData({
        name: cred.name || '',
        typeName,
        typeId,
        isTypeLocked: true,
        issueDate: cred.issueDate || '',
        expireDate: cred.expireDate || cred.expiryDate || '',
        credentialNumber: cred.credentialNumber || '',
        issuingAuthority: cred.issuingAuthority || '',
        skillLevel,
        skillLevelIndex: getSkillLevelIndex(skillLevel),
        remark: cred.remark || '',
        fileUrl: cred.fileUrl || '',
        status: cred.status || 'pending',
        statusLabel: constants.CREDENTIAL_STATUS_LABEL[cred.status] || cred.status || '',
        fileIds: flatFileIds,
        fileSides: flatFileSides,
        idCardFrontFileId: idCardFront ? idCardFront.fileAsset.id : '',
        idCardBackFileId: idCardBack ? idCardBack.fileAsset.id : '',
        idCardFrontUrl: '',
        idCardBackUrl: '',
        selectedSkillIds: linkedSkillIds,
        selectedSkillNames: (cred.linkedSkills || []).map((skill) => skill.categoryName)
      });

      // Load previews for ID card front/back
      if (idCardFront && idCardFront.fileAsset.id) {
        this.loadPrivatePreview(idCardFront.fileAsset.id, 'idCardFrontUrl');
      }
      if (idCardBack && idCardBack.fileAsset.id) {
        this.loadPrivatePreview(idCardBack.fileAsset.id, 'idCardBackUrl');
      }
      // Load preview for non-ID-card credentials (e.g., skill_cert, health_cert)
      if (!idCardFront && !idCardBack && files.length > 0 && files[0].fileAsset && files[0].fileAsset.id) {
        this.loadPrivatePreview(files[0].fileAsset.id, 'fileUrl');
      }

      this.applyTypeState(typeId, typeName, true);
    }).catch(() => {});
  },

  loadPrivatePreview(fileId, targetKey) {
    const key = targetKey || 'fileUrl';
    const token = authUtil.getToken();
    wx.downloadFile({
      url: buildPrivatePreviewUrl(fileId),
      header: {
        Authorization: 'Bearer ' + token
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300 && res.tempFilePath) {
          const data = {};
          data[key] = res.tempFilePath;
          this.setData(data);
        }
      }
    });
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

  onEducationLevelChange(e) {
    const index = parseInt(e.detail.value);
    const option = this.data.educationLevelOptions[index];
    this.setData({
      educationLevelIndex: index,
      name: option ? option.value : ''
    });
  },

  onNumberInput(e) {
    this.setData({ credentialNumber: e.detail.value });
  },

  onIssuingAuthorityInput(e) {
    this.setData({ issuingAuthority: e.detail.value });
  },

  onInsuranceCompanyChange(e) {
    const index = parseInt(e.detail.value);
    const option = this.data.insuranceCompanyOptions[index];
    const value = option ? option.value : '';
    this.setData({
      insuranceCompanyIndex: index,
      issuingAuthority: value === '其他' ? this.data.insuranceCompanyOther : value,
      showInsuranceCompanyOther: value === '其他'
    });
  },

  onInsuranceCompanyOtherInput(e) {
    this.setData({
      insuranceCompanyOther: e.detail.value,
      issuingAuthority: e.detail.value
    });
  },

  onSkillLevelChange(e) {
    const index = parseInt(e.detail.value);
    const option = this.data.skillLevelOptions[index];
    this.setData({
      skillLevelIndex: index,
      skillLevel: option ? option.value : ''
    });
  },

  onIssueDateChange(e) {
    this.setData({ issueDate: e.detail.value });
  },

  onExpireDateChange(e) {
    this.setData({ expireDate: e.detail.value });
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  onIdCardFocus() {
    this.setData({ idCardKeyboardActive: true });
  },

  onIdCardBlur() {
    this.setData({ idCardKeyboardActive: false });
  },

  onIdCardConfirm() {
    // Dismiss keyboard and restore layout
    this.setData({ idCardKeyboardActive: false });
  },

  handleUploadImage() {
    uploadUtil.chooseAndUpload(
      constants.API.FILES_UPLOAD,
      'file'
    ).then((res) => {
      const fileId = res.data?.id || res.id || '';
      const fileUrl = res.data?.fileUrl || res.fileUrl || res.localFilePath || '';
      if (fileId) {
        const fileIds = this.data.fileIds || [];
        fileIds.push(fileId);
        const fileSides = this.data.fileSides || [];
        fileSides.push('credential_image');
        this.setData({
          fileIds,
          fileSides,
          fileUrl
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

  handleUploadIdCardFront() {
    uploadUtil.chooseAndUpload(constants.API.FILES_UPLOAD, 'file').then((res) => {
      const fileId = res.data?.id || res.id || '';
      if (fileId) {
        this.setData({ idCardFrontFileId: fileId, idCardFrontUrl: res.localFilePath || '' });
        wx.showToast({ title: '人像面已上传', icon: 'success' });
      }
    }).catch((err) => { console.error('上传失败', err); });
  },

  handleUploadIdCardBack() {
    uploadUtil.chooseAndUpload(constants.API.FILES_UPLOAD, 'file').then((res) => {
      const fileId = res.data?.id || res.id || '';
      if (fileId) {
        this.setData({ idCardBackFileId: fileId, idCardBackUrl: res.localFilePath || '' });
        wx.showToast({ title: '国徽面已上传', icon: 'success' });
      }
    }).catch((err) => { console.error('上传失败', err); });
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
    if (this.data.isIdCard) {
      if (!this.data.idCardFrontFileId) {
        wx.showToast({ title: '请上传身份证人像面', icon: 'none' });
        return false;
      }
      if (!this.data.idCardBackFileId) {
        wx.showToast({ title: '请上传身份证国徽面', icon: 'none' });
        return false;
      }
      if (!this.data.credentialNumber || !this.data.credentialNumber.trim()) {
        wx.showToast({ title: '请填写身份证号', icon: 'none' });
        return false;
      }
    }
    if (this.data.showExpireDate) {
      if (!this.data.issueDate) {
        wx.showToast({ title: '请选择' + this.data.issueDateLabel, icon: 'none' });
        return false;
      }
      if (!this.data.expireDate) {
        wx.showToast({ title: '请选择' + this.data.expireDateLabel, icon: 'none' });
        return false;
      }
      if (isNaN(Date.parse(this.data.issueDate))) {
        wx.showToast({ title: this.data.issueDateLabel + '格式无效', icon: 'none' });
        return false;
      }
      if (isNaN(Date.parse(this.data.expireDate))) {
        wx.showToast({ title: this.data.expireDateLabel + '格式无效', icon: 'none' });
        return false;
      }
      if (this.data.expireDate < this.data.issueDate) {
        wx.showToast({ title: this.data.expireDateLabel + '不能早于' + this.data.issueDateLabel, icon: 'none' });
        return false;
      }
    }
    if (this.data.typeId === 'insurance') {
      if (!this.data.credentialNumber || !this.data.credentialNumber.trim()) {
        wx.showToast({ title: '请填写保险单号', icon: 'none' });
        return false;
      }
      if (!this.data.issuingAuthority || !this.data.issuingAuthority.trim()) {
        wx.showToast({ title: '请选择保险公司', icon: 'none' });
        return false;
      }
    }
    if (this.data.requireIssueDate && !this.data.issueDate) {
      wx.showToast({ title: '请选择' + this.data.issueDateLabel, icon: 'none' });
      return false;
    }
    if (this.data.showIssueDate && this.data.issueDate && isNaN(Date.parse(this.data.issueDate))) {
      wx.showToast({ title: this.data.issueDateLabel + '格式无效', icon: 'none' });
      return false;
    }
    if (this.data.showInsuranceCompanyOther && !this.data.insuranceCompanyOther.trim()) {
      wx.showToast({ title: '请填写保险公司', icon: 'none' });
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
    if (this.data.isSkillCert && (!this.data.fileIds || this.data.fileIds.length === 0)) {
      wx.showToast({ title: '请上传技能证书图片', icon: 'none' });
      return false;
    }
    if (this.data.imageRequired && (!this.data.fileIds || this.data.fileIds.length === 0)) {
      wx.showToast({ title: '请上传证件图片', icon: 'none' });
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
      remark: this.data.remark
    };

    // Build files array with side info
    if (this.data.isIdCard) {
      data.files = [];
      if (this.data.idCardFrontFileId) {
        data.files.push({ fileId: this.data.idCardFrontFileId, fileSide: 'front' });
      }
      if (this.data.idCardBackFileId) {
        data.files.push({ fileId: this.data.idCardBackFileId, fileSide: 'back' });
      }
    } else {
      const fileSides = this.data.fileSides || [];
      data.files = (this.data.fileIds || []).map((fid, i) => ({
        fileId: fid,
        fileSide: fileSides[i] || 'credential_image'
      }));
    }

    if (this.data.isSkillCert) {
      data.skillLevel = this.data.skillLevel;
      data.staffSkillCategories = this.getSelectedSkillCategories();
    } else {
      data.credentialNumber = this.data.showCredentialNumber ? this.data.credentialNumber : '';
      data.issuingAuthority = this.data.showIssuingAuthority ? this.data.issuingAuthority : '';
      data.issueDate = this.data.showIssueDate ? this.data.issueDate : '';
      data.expireDate = this.data.showExpireDate ? this.data.expireDate : '';
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
