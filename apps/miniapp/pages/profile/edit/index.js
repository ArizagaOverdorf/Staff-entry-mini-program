const request = require('../../../utils/request');
const uploadUtil = require('../../../utils/upload');
const constants = require('../../../utils/constants');
const {
  extractUploadedFileId,
  normalizeAvatarUrl,
  getAvatarText,
  resolveAvatarValue,
  setCachedAvatarFileId
} = require('../../../utils/avatar');

const REQUIRED_CREDENTIALS = [
  { typeId: 'id_card', title: '居民身份证', desc: '必传，请分别上传人像面和国徽面' },
  { typeId: 'health_cert', title: '健康证', desc: '必传，请上传有效期内健康证' },
  { typeId: 'no_crime_cert', title: '无犯罪记录证明', desc: '必传，请上传公安机关或指定渠道出具的证明' },
  { typeId: 'credit_report', title: '征信报告', desc: '必传，请上传个人征信报告' },
  { typeId: 'medical_report', title: '体检报告', desc: '必传，请上传体检报告' }
];

const OPTIONAL_CREDENTIALS = [
  { typeId: 'insurance', title: '保险', desc: '选填，可上传意外险、责任险等材料' },
  { typeId: 'education', title: '学历/毕业证', desc: '选填，适用于看重学历背景的服务' },
  { typeId: 'student_card', title: '学生证', desc: '选填，适用于未毕业学生兼职' },
  { typeId: 'other', title: '其他资料', desc: '选填，可上传补充证明材料' }
];

function normalizeCategory(item) {
  return {
    value: item.value || item.categoryId || item.dictKey || item.id,
    label: item.label || item.categoryName || item.dictValue || item.name,
    categoryId: item.categoryId || item.dictKey || item.value || item.id,
    categoryName: item.categoryName || item.dictValue || item.label || item.name
  };
}

function normalizeArea(item) {
  const fallbackLabel = [item.province, item.city, item.district].filter(Boolean).join('');
  const regionValue = [item.province, item.city, item.district].filter(Boolean).join('_');
  return {
    value: regionValue || item.value || item.areaId || item.dictKey || item.id,
    label: item.label || item.areaName || item.dictValue || item.name || fallbackLabel,
    province: item.province || '',
    city: item.city || '',
    district: item.district || ''
  };
}

function hasExpectedServiceCategories(list) {
  const values = list.map(function(item) { return item.value || item.categoryId; });
  return constants.SERVICE_SKILL_OPTIONS.every(function(item) { return values.indexOf(item.value) > -1; });
}

function getStatusLabel(status) {
  return constants.CREDENTIAL_STATUS_LABEL[status] || '未上传';
}

function getStatusClass(status) {
  const map = { pending: 'tag-warning', approved: 'tag-success', rejected: 'tag-error', expired: 'tag-error' };
  return map[status] || 'tag-info';
}

function getTypeLabel(typeId) {
  const item = constants.CREDENTIAL_TYPES.find(function(type) { return type.value === typeId; });
  return item ? item.label : typeId;
}

function normalizeCredential(credential) {
  const status = credential.status || credential.credentialStatus || 'pending';
  const typeId = credential.typeId || credential.credentialType;
  const isExpired = credential.isExpired || credential.expiryStatusLabel === '证件过期';
  return Object.assign({}, credential, {
    id: credential.id || credential.credentialId || '',
    typeId: typeId,
    typeName: credential.typeName || getTypeLabel(typeId),
    status: status,
    statusLabel: isExpired ? '证件过期' : getStatusLabel(status),
    statusClass: isExpired ? 'tag-error' : getStatusClass(status),
    fileCount: credential.files ? credential.files.length : 0
  });
}

function buildUploadCards(types, credentials) {
  return types.map(function(item) {
    var credential = credentials.find(function(c) { return c.typeId === item.typeId; });
    return {
      typeId: item.typeId,
      title: item.title,
      desc: item.desc,
      typeName: getTypeLabel(item.typeId),
      credentialId: credential ? credential.id : '',
      hasCredential: !!credential,
      statusLabel: credential ? credential.statusLabel : '未上传',
      statusClass: credential ? credential.statusClass : 'tag-info',
      fileCount: credential ? credential.fileCount : 0,
      actionText: credential ? '查看/更新' : '去上传'
    };
  });
}

function logAvatarDebug(stage, payload) {
  console.log('[AvatarDebug][profile-edit][' + stage + ']', payload);
}

Page({
  data: {
    // Profile fields
    name: '',
    gender: '',
    genderIndex: -1,
    birthday: '',
    phone: '',
    address: '',
    avatarUrl: '',
    avatarFileId: '',
    avatarPreviewUrl: '',
    avatarText: '人',
    emergencyContact: '',
    emergencyPhone: '',
    genderOptions: constants.GENDER_OPTIONS,
    genderLabel: '请选择性别',
    serviceCategories: [],
    selectedCategories: [],
    serviceAreas: [],
    selectedAreas: [],
    isSubmitting: false,
    isSaving: false,
    isEdit: false,
    avatarChanged: false,

    // Credential cards
    credentials: [],
    requiredCredentialCards: [],
    optionalCredentialCards: [],

    // Skill entries
    loaded: false,
    skillEntries: [],
    editingEntryIndex: -1,
    editSkillName: '',
    editSkillNameIndex: -1,
    editSkillLevel: '',
    editSkillLevelIndex: -1,
    editWorkDuration: '',
    editRelatedSkills: [],
    editRelatedSkillText: '',
    editFiles: [],
    editFileUrls: [],
    editIsSubmitting: false,
    skillNameOptions: constants.CERTIFICATE_SKILL_OPTIONS,
    skillLevelOptions: constants.SKILL_LEVEL_OPTIONS,
    relatedSkillOptions: constants.RELATED_SERVICE_SKILLS,
    shouldRefreshProfileDerivedFields: false
  },

  onLoad() {
    this.loadProfile();
    this.loadDictionaries();
    this.loadCredentials();
    this.loadSkillEntries();
  },

  onShow() {
    this.loadCredentials();
    this.loadSkillEntries();
    if (this.data.shouldRefreshProfileDerivedFields) {
      this.refreshProfileDerivedFields();
    }
  },

  // ──────────── Profile ────────────

  loadProfile() {
    var that = this;
    request.get(constants.API.PROFILE).then(function(res) {
      if (res.profile) {
        const p = res.profile;
        const avatarValue = resolveAvatarValue(p, res);
        logAvatarDebug('loadProfile.profile', {
          rawProfileAvatarUrl: p.avatarUrl || '',
          rawProfileAvatarFileId: p.avatarFileId || '',
          resolvedAvatarValue: avatarValue,
          normalizedAvatarUrl: normalizeAvatarUrl(avatarValue)
        });
        var genderIndex = -1;
        if (p.gender) {
          genderIndex = constants.GENDER_OPTIONS.findIndex(function(g) { return g.value === p.gender; });
        }
        that.setData({
          name: p.name || '',
          gender: p.gender || '',
          genderIndex: genderIndex,
          genderLabel: genderIndex >= 0 ? constants.GENDER_OPTIONS[genderIndex].label : '请选择性别',
          birthday: p.birthday || '',
          phone: p.phone || res.phone || '',
          address: p.address || '',
          avatarUrl: avatarValue,
          avatarFileId: avatarValue,
          avatarPreviewUrl: normalizeAvatarUrl(avatarValue),
          avatarText: getAvatarText(p.name || p.nameMasked || ''),
          emergencyContact: p.emergencyContact || '',
          emergencyPhone: p.emergencyPhone || '',
          selectedCategories: p.serviceCategories || [],
          selectedAreas: p.serviceAreas || [],
          isEdit: true
        });
      } else {
        const avatarValue = resolveAvatarValue({}, res);
        that.setData({
          phone: res.phone || '',
          avatarUrl: avatarValue,
          avatarFileId: avatarValue,
          avatarPreviewUrl: normalizeAvatarUrl(avatarValue),
          avatarText: getAvatarText('')
        });
      }
    }).catch(function() {});
  },

  refreshProfileDerivedFields() {
    var that = this;
    request.get(constants.API.PROFILE).then(function(res) {
      var p = res.profile || {};
      that.setData({
        birthday: p.birthday || '',
        phone: p.phone || res.phone || that.data.phone || '',
        shouldRefreshProfileDerivedFields: false
      });
    }).catch(function() {
      that.setData({ shouldRefreshProfileDerivedFields: false });
    });
  },

  loadDictionaries() {
    var that = this;
    request.get(constants.API.SERVICE_CATEGORIES, { groups: 'service_category' }).then(function(res) {
      const apiCategories = (res.service_category || []).map(normalizeCategory);
      const categories = hasExpectedServiceCategories(apiCategories)
        ? apiCategories
        : constants.SERVICE_SKILL_OPTIONS.map(normalizeCategory);
      that.setData({ serviceCategories: categories });
    }).catch(function() {
      that.setData({ serviceCategories: constants.SERVICE_SKILL_OPTIONS.map(normalizeCategory) });
    });

    request.get(constants.API.SERVICE_AREAS, { groups: 'service_area' }).then(function(res) {
      that.setData({ serviceAreas: constants.SERVICE_AREA_OPTIONS });
    }).catch(function() {
      that.setData({ serviceAreas: constants.SERVICE_AREA_OPTIONS });
    });
  },

  handleAvatarUpload() {
    var that = this;
    wx.showActionSheet({
      itemList: ['拍照上传', '从相册选择'],
      success: function(res) {
        const sourceType = res.tapIndex === 0 ? ['camera'] : ['album'];
        that.chooseAvatarAndUpload(sourceType);
      }
    });
  },

  chooseAvatarAndUpload(sourceType) {
    var that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: sourceType,
      sizeType: ['compressed'],
      success: function(res) {
        const tempFile = res.tempFiles[0];
        wx.showLoading({ title: '上传中...', mask: true });
        uploadUtil.uploadFile(constants.API.FILES_UPLOAD, tempFile.tempFilePath, 'file', { purpose: 'avatar' })
          .then(function(uploadRes) {
            const fileId = extractUploadedFileId(uploadRes);
            if (!fileId) {
              wx.showToast({ title: '头像上传失败', icon: 'none' });
              return;
            }
            that.setData({
              avatarUrl: fileId,
              avatarFileId: fileId,
              avatarPreviewUrl: tempFile.tempFilePath,
              avatarChanged: true
            });
            setCachedAvatarFileId(fileId, tempFile.tempFilePath);
            wx.showToast({ title: '头像已上传', icon: 'success' });
          }).catch(function(err) {
            console.error('头像上传失败', err);
          }).finally(function() {
            wx.hideLoading();
          });
      }
    });
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value, avatarText: getAvatarText(e.detail.value) });
  },

  onAvatarImageLoad(e) {
    logAvatarDebug('image.load', { src: this.data.avatarPreviewUrl || this.data.avatarUrl, event: e.detail || {} });
  },

  onAvatarImageError(e) {
    logAvatarDebug('image.error', { src: this.data.avatarPreviewUrl || this.data.avatarUrl, event: e.detail || {} });
  },

  onAddressInput(e) { this.setData({ address: e.detail.value }); },
  onEmergencyContactInput(e) { this.setData({ emergencyContact: e.detail.value }); },
  onEmergencyPhoneInput(e) { this.setData({ emergencyPhone: e.detail.value }); },

  onGenderChange(e) {
    const index = parseInt(e.detail.value);
    const opt = constants.GENDER_OPTIONS[index];
    this.setData({
      genderIndex: index,
      gender: opt ? opt.value : '',
      genderLabel: opt ? opt.label : '请选择性别'
    });
  },

  onCategoryChange(e) {
    this.setData({ selectedCategories: e.detail.selectedValues || [] });
  },

  onAreaChange(e) {
    this.setData({ selectedAreas: e.detail.selectedValues || [] });
  },

  validateProfile() {
    if (!this.data.name) {
      wx.showToast({ title: '请输入姓名', icon: 'none' });
      return false;
    }
    if (this.data.genderIndex < 0) {
      wx.showToast({ title: '请选择性别', icon: 'none' });
      return false;
    }
    return true;
  },

  // ──────────── Credential loading ────────────

  loadCredentials() {
    var that = this;
    request.get(constants.API.CREDENTIALS).then(function(res) {
      var list = (res.list || res.credentials || []).map(normalizeCredential);
      var currentList = list.filter(function(item) { return item.isCurrent !== false; });
      that.setData({
        credentials: currentList,
        requiredCredentialCards: buildUploadCards(REQUIRED_CREDENTIALS, currentList),
        optionalCredentialCards: buildUploadCards(OPTIONAL_CREDENTIALS, currentList),
        loaded: true
      });
    }).catch(function() {
      that.setData({ loaded: true });
    });
  },

  goToCredentialType(e) {
    var typeId = e.currentTarget.dataset.type;
    var typeName = e.currentTarget.dataset.name || getTypeLabel(typeId);
    var credentialId = e.currentTarget.dataset.id;
    if (typeId === 'id_card') {
      this.setData({ shouldRefreshProfileDerivedFields: true });
    }
    if (credentialId) {
      wx.navigateTo({ url: '/pages/credential/edit/index?id=' + credentialId });
      return;
    }
    wx.navigateTo({
      url: '/pages/credential/edit/index?typeId=' + typeId + '&typeName=' + encodeURIComponent(typeName)
    });
  },

  // ──────────── Skill entries ────────────

  loadSkillEntries() {
    var that = this;
    request.get(constants.API.SKILL_ENTRIES).then(function(res) {
      var entries = (res.entries || []).map(function(e) {
        return {
          entryIndex: e.entryIndex,
          skillName: e.skillName || '',
          skillLevel: e.skillLevel || '',
          workDurationMonths: e.workDurationMonths || '',
          relatedServiceSkills: e.relatedServiceSkills || [],
          files: e.files || [],
          isFilled: !!(e.skillName)
        };
      });
      that.setData({ skillEntries: entries });
    }).catch(function() {
      var entries = [];
      for (var i = 1; i <= 3; i++) {
        entries.push({
          entryIndex: i,
          skillName: '',
          skillLevel: '',
          workDurationMonths: '',
          relatedServiceSkills: [],
          files: [],
          isFilled: false
        });
      }
      that.setData({ skillEntries: entries });
    });
  },

  onEditSkillEntry(e) {
    var entryIndex = parseInt(e.currentTarget.dataset.index);
    var entry = this.data.skillEntries.find(function(en) { return en.entryIndex === entryIndex; });
    if (!entry) return;

    var relatedSkillOptions = constants.RELATED_SERVICE_SKILLS.map(function(rs) {
      return { value: rs.value, label: rs.label, checked: (entry.relatedServiceSkills || []).indexOf(rs.value) > -1 };
    });
    var relatedText = (entry.relatedServiceSkills || []).join('、');
    var existingFileIds = (entry.files || []).map(function(f) { return f.fileAsset ? f.fileAsset.id : ''; }).filter(Boolean);

    this.setData({
      editingEntryIndex: entryIndex,
      editSkillName: entry.skillName,
      editSkillNameIndex: entry.skillName
        ? constants.CERTIFICATE_SKILL_OPTIONS.findIndex(function(o) { return o.value === entry.skillName; })
        : -1,
      editSkillLevel: entry.skillLevel,
      editSkillLevelIndex: entry.skillLevel
        ? constants.SKILL_LEVEL_OPTIONS.findIndex(function(o) { return o.value === entry.skillLevel; })
        : -1,
      editWorkDuration: entry.workDurationMonths ? String(entry.workDurationMonths) : '',
      editRelatedSkills: entry.relatedServiceSkills || [],
      editRelatedSkillText: relatedText,
      editFiles: existingFileIds,
      editFileUrls: existingFileIds.map(function() { return ''; }),
      editIsSubmitting: false
    });

    var that = this;
    existingFileIds.forEach(function(fileId, index) {
      wx.downloadFile({
        url: constants.API_BASE_URL + '/app/files/' + fileId + '/preview',
        header: { Authorization: 'Bearer ' + (wx.getStorageSync('token') || '') },
        success: function(res) {
          if (res.statusCode >= 200 && res.statusCode < 300 && res.tempFilePath) {
            var urls = that.data.editFileUrls || [];
            urls[index] = res.tempFilePath;
            that.setData({ editFileUrls: urls });
          }
        }
      });
    });
  },

  onCancelEditEntry() {
    this.setData({ editingEntryIndex: -1 });
    this.loadSkillEntries();
  },

  onEditSkillNameChange(e) {
    var index = parseInt(e.detail.value);
    var option = constants.CERTIFICATE_SKILL_OPTIONS[index];
    this.setData({ editSkillNameIndex: index, editSkillName: option ? option.value : '' });
  },

  onEditSkillLevelChange(e) {
    var index = parseInt(e.detail.value);
    var option = constants.SKILL_LEVEL_OPTIONS[index];
    this.setData({ editSkillLevelIndex: index, editSkillLevel: option ? option.value : '' });
  },

  onEditWorkDurationInput(e) {
    this.setData({ editWorkDuration: e.detail.value });
  },

  onEditRelatedSkillToggle(e) {
    var value = e.currentTarget.dataset.value;
    var skills = this.data.editRelatedSkills || [];
    var idx = skills.indexOf(value);
    if (idx > -1) {
      skills = skills.filter(function(s) { return s !== value; });
    } else {
      skills = skills.concat([value]);
    }
    this.setData({ editRelatedSkills: skills, editRelatedSkillText: skills.join('、') });
  },

  onEditUploadImage() {
    var that = this;
    var remainingCount = 3 - (this.data.editFiles || []).length;
    if (remainingCount <= 0) {
      wx.showToast({ title: '最多上传3张证书图片', icon: 'none' });
      return;
    }
    wx.chooseMedia({
      count: remainingCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: function(res) {
        var files = res.tempFiles;
        var uploadedIds = [];
        var uploadedUrls = [];
        var uploadPromises = [];

        for (var i = 0; i < files.length; i++) {
          (function(file) {
            var promise = new Promise(function(resolve, reject) {
              wx.uploadFile({
                url: constants.API_BASE_URL + constants.API.FILES_UPLOAD,
                filePath: file.tempFilePath,
                name: 'file',
                header: { Authorization: 'Bearer ' + (wx.getStorageSync('token') || '') },
                success: function(uploadRes) {
                  try {
                    var data = JSON.parse(uploadRes.data);
                    var fileId = (data && data.data && data.data.id) || (data && data.id) || '';
                    if (fileId) { uploadedIds.push(fileId); uploadedUrls.push(file.tempFilePath); resolve(); }
                    else { reject(new Error('上传失败')); }
                  } catch (e) { reject(e); }
                },
                fail: reject
              });
            });
            uploadPromises.push(promise);
          })(files[i]);
        }

        Promise.all(uploadPromises).then(function() {
          var currentFiles = that.data.editFiles || [];
          var currentUrls = that.data.editFileUrls || [];
          var totalFiles = currentFiles.length + uploadedIds.length;
          if (totalFiles > 3) {
            wx.showToast({ title: '最多上传3张证书图片', icon: 'none' });
            return;
          }
          that.setData({
            editFiles: currentFiles.concat(uploadedIds),
            editFileUrls: currentUrls.concat(uploadedUrls)
          });
          wx.showToast({ title: '上传成功', icon: 'success' });
        }).catch(function(err) {
          console.error('上传失败', err);
        });
      }
    });
  },

  onEditRemoveImage(e) {
    var index = parseInt(e.currentTarget.dataset.index);
    var files = this.data.editFiles || [];
    var urls = this.data.editFileUrls || [];
    files.splice(index, 1);
    urls.splice(index, 1);
    this.setData({ editFiles: files, editFileUrls: urls });
  },

  onClearSkillEntry(e) {
    var entryIndex = parseInt(e.currentTarget.dataset.index);
    var that = this;
    wx.showModal({
      title: '清空技能条目',
      content: '确认清空该技能条目的所有内容？',
      success: function(res) {
        if (res.confirm) { that.saveSkillEntry(entryIndex, false); }
      }
    });
  },

  onSaveSkillEntry() {
    var that = this;
    var entryIndex = this.data.editingEntryIndex;
    var isFilling = !!(this.data.editSkillName && this.data.editSkillName.trim());

    if (isFilling) {
      if (!this.data.editSkillName) { wx.showToast({ title: '请选择技能名称', icon: 'none' }); return; }
      if (!this.data.editSkillLevel) { wx.showToast({ title: '请选择等级', icon: 'none' }); return; }
      var duration = parseInt(this.data.editWorkDuration);
      if (isNaN(duration) || duration < 1) { wx.showToast({ title: '相关工作时长必须为正整数（月）', icon: 'none' }); return; }
      if (!this.data.editFiles || this.data.editFiles.length === 0) { wx.showToast({ title: '请上传至少1张证书图片', icon: 'none' }); return; }
      if (this.data.editFiles.length > 3) { wx.showToast({ title: '最多上传3张证书图片', icon: 'none' }); return; }

      var otherEntries = this.data.skillEntries.filter(function(e) { return e.entryIndex !== entryIndex; });
      var duplicate = otherEntries.find(function(e) { return e.skillName === that.data.editSkillName; });
      if (duplicate) { wx.showToast({ title: '技能名称「' + that.data.editSkillName + '」已在其他条目中使用', icon: 'none' }); return; }
    }

    this.saveSkillEntry(entryIndex, isFilling, {
      skillName: this.data.editSkillName,
      skillLevel: this.data.editSkillLevel,
      workDurationMonths: parseInt(this.data.editWorkDuration) || null,
      relatedServiceSkills: this.data.editRelatedSkills,
      fileIds: this.data.editFiles
    });
  },

  saveSkillEntry(entryIndex, isFilled, data) {
    var that = this;
    this.setData({ editIsSubmitting: true });
    var payload = {
      entryIndex: entryIndex,
      skillName: isFilled ? (data ? data.skillName : '') : '',
      skillLevel: isFilled ? (data ? data.skillLevel : '') : '',
      workDurationMonths: isFilled ? (data ? data.workDurationMonths : null) : null,
      relatedServiceSkills: isFilled ? (data ? data.relatedServiceSkills : []) : [],
      fileIds: isFilled ? (data ? data.fileIds : []) : []
    };
    request.put(constants.API.SKILL_ENTRY_UPSERT, payload).then(function() {
      wx.showToast({ title: '保存成功', icon: 'success' });
      that.setData({ editingEntryIndex: -1, editIsSubmitting: false });
      that.loadSkillEntries();
    }).catch(function(err) {
      console.error('保存技能条目失败', err);
      that.setData({ editIsSubmitting: false });
    });
  },

  // ──────────── Save profile ────────────

  handleSave() {
    var that = this;
    if (this.data.isSaving || this.data.isSubmitting) return;
    if (!this.validateProfile()) return;

    this.setData({ isSaving: true });

    var profileData = {
      name: this.data.name,
      gender: this.data.gender,
      avatarUrl: this.data.avatarFileId || this.data.avatarUrl,
      address: this.data.address,
      emergencyContact: this.data.emergencyContact,
      emergencyPhone: this.data.emergencyPhone
    };
    var avatarChanged = this.data.avatarChanged;
    var uploadedFileId = this.data.avatarFileId;

    request.put(constants.API.PROFILE_UPDATE, profileData).then(function(updatedProfile) {
      var updatedAvatarValue = resolveAvatarValue(updatedProfile, updatedProfile);
      if (updatedAvatarValue) { setCachedAvatarFileId(updatedAvatarValue); }

      var skillsData = {
        skills: that.data.selectedCategories.map(function(c) {
          return {
            categoryId: c.categoryId || c.dictKey || c.id || c.value,
            categoryName: c.categoryName || c.dictValue || c.label || c.name,
            skillLevel: c.skillLevel || c.level,
            description: c.description || ''
          };
        })
      };
      var areasData = {
        areas: that.data.selectedAreas.map(function(a) {
          return { province: a.province || a.dictValue || a.label || a.name || '', city: a.city || '', district: a.district || '' };
        })
      };
      var promises = [
        request.put(constants.API.PROFILE + '/skills', skillsData),
        request.put(constants.API.PROFILE + '/service-areas', areasData)
      ];
      return Promise.all(promises).then(function() { return updatedProfile; });
    }).then(function(updatedProfile) {
      if (avatarChanged) {
        return request.get(constants.API.PROFILE).then(function(savedProfile) {
          var profile = savedProfile.profile || {};
          var returnedAvatarUrl = resolveAvatarValue(profile, savedProfile);
          if (!returnedAvatarUrl || returnedAvatarUrl !== uploadedFileId) {
            wx.showToast({ title: '头像未保存成功，请重试', icon: 'none' });
            return;
          }
          that.setData({
            avatarUrl: returnedAvatarUrl,
            avatarFileId: returnedAvatarUrl,
            avatarPreviewUrl: normalizeAvatarUrl(returnedAvatarUrl),
            avatarChanged: false
          });
          setCachedAvatarFileId(returnedAvatarUrl);
        });
      }
    }).then(function() {
      wx.showToast({ title: '保存成功', icon: 'success' });
    }).catch(function(err) {
      if (err) { console.error('保存失败', err); }
    }).finally(function() {
      that.setData({ isSaving: false });
    });
  },

  // ──────────── Submit review ────────────

  handleSubmitReview() {
    var that = this;
    if (this.data.isSubmitting || this.data.isSaving) return;

    this.setData({ isSubmitting: true });
    request.get(constants.API.INTAKE_PREVIEW).then(function(preview) {
      if (!preview.canSubmit) {
        var issues = preview.issues || [];
        wx.showModal({
          title: '资料不完整',
          content: issues.length > 0 ? issues.slice(0, 5).join('\n') : '请先完善个人资料和必填证件后再提交审核。',
          showCancel: false
        });
        return Promise.reject(new Error('资料不完整'));
      }
      return new Promise(function(resolve, reject) {
        wx.showModal({
          title: '提交审核',
          content: '确认提交当前资料进入审核流程？',
          success: function(res) { if (res.confirm) resolve(); else reject(new Error('用户取消提交')); },
          fail: reject
        });
      });
    }).then(function() {
      return request.post(constants.API.SUBMIT_INTAKE);
    }).then(function() {
      wx.showToast({ title: '已提交审核', icon: 'success', duration: 1500 });
      setTimeout(function() { wx.navigateBack(); }, 1500);
    }).catch(function(err) {
      if (err && err.message !== '资料不完整' && err.message !== '用户取消提交') {
        console.error('提交审核失败', err);
      }
    }).finally(function() {
      that.setData({ isSubmitting: false });
    });
  }
});
