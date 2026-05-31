const request = require('../../utils/request');
const constants = require('../../utils/constants');

const REQUIRED_CREDENTIALS = [
  {
    typeId: 'id_card',
    title: '居民身份证',
    desc: '必传，请分别上传人像面和国徽面'
  },
  {
    typeId: 'health_cert',
    title: '健康证',
    desc: '必传，请上传有效期内健康证'
  },
  {
    typeId: 'no_crime_cert',
    title: '无犯罪记录证明',
    desc: '必传，请上传公安机关或指定渠道出具的证明'
  }
];

const CONDITIONAL_CREDENTIALS = [
  {
    typeId: 'credit_report',
    title: '征信报告',
    desc: '默认必传；仅勾选保洁/厨师且不填写技能证书时可不传'
  },
  {
    typeId: 'medical_report',
    title: '体检报告',
    desc: '默认必传；仅勾选保洁/厨师且不填写技能证书时可不传'
  }
];

const OPTIONAL_CREDENTIALS = [
  {
    typeId: 'insurance',
    title: '保险',
    desc: '选填，可上传意外险、责任险等材料'
  },
  {
    typeId: 'education',
    title: '学历/毕业证',
    desc: '选填，适用于看重学历背景的服务'
  },
  {
    typeId: 'student_card',
    title: '学生证',
    desc: '选填，适用于未毕业学生兼职'
  },
  {
    typeId: 'other',
    title: '其他资料',
    desc: '选填，可上传补充证明材料'
  }
];

function getStatusLabel(status) {
  return constants.CREDENTIAL_STATUS_LABEL[status] || '未上传';
}

function getStatusClass(status) {
  const map = {
    pending: 'tag-warning',
    approved: 'tag-success',
    rejected: 'tag-error',
    expired: 'tag-error'
  };
  return map[status] || 'tag-info';
}

function getTypeLabel(typeId) {
  const item = constants.CREDENTIAL_TYPES.find(function(type) { return type.value === typeId; });
  return item ? item.label : typeId;
}

function normalizeCredential(credential) {
  const status = credential.status || credential.credentialStatus || 'pending';
  const typeId = credential.typeId || credential.credentialType;
  const linkedSkills = credential.linkedSkills || [];
  const isExpired = credential.isExpired || credential.expiryStatusLabel === '证件过期';
  const expiryStatusLabel = credential.expiryStatusLabel || (isExpired ? '证件过期' : undefined);
  return {
    ...credential,
    typeId: typeId,
    typeName: credential.typeName || getTypeLabel(typeId),
    status: status,
    statusLabel: isExpired ? '证件过期' : getStatusLabel(status),
    statusClass: isExpired ? 'tag-error' : getStatusClass(status),
    isExpired: isExpired,
    expiryStatusLabel: expiryStatusLabel,
    fileCount: credential.files ? credential.files.length : 0,
    skillLevelText: credential.skillLevel
      ? '技能等级：' + credential.skillLevel
      : '未填写技能等级',
    linkedSkillText: linkedSkills.length > 0
      ? '已关联 ' + linkedSkills.length + ' 项技能'
      : ''
  };
}

function buildUploadCards(types, credentials) {
  return types.map(function(item) {
    var credential = credentials.find(function(c) { return c.typeId === item.typeId; });
    return {
      ...item,
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

Page({
  data: {
    credentials: [],
    requiredCredentialCards: [],
    conditionalCredentialCards: [],
    skillCertificates: [],
    optionalCredentialCards: [],
    loaded: false,
    isSubmitting: false,
    // Independent skills
    independentSkills: [],
    // Skill entries
    skillEntries: [],
    // Expanding skill entry editor
    editingEntryIndex: -1,
    editingEntry: null,
    // Form data for editing skill entry
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
    // Skill name options
    skillNameOptions: constants.CERTIFICATE_SKILL_OPTIONS,
    // Skill level options
    skillLevelOptions: constants.SKILL_LEVEL_OPTIONS,
    // Related service skill options
    relatedSkillOptions: constants.RELATED_SERVICE_SKILLS
  },

  onLoad() {
    this.loadAllData();
  },

  onShow() {
    this.loadAllData();
  },

  loadAllData() {
    var that = this;
    var promises = [
      this.loadCredentials(),
      this.loadIndependentSkills(),
      this.loadSkillEntries()
    ];
    Promise.all(promises).then(function() {
      that.setData({ loaded: true });
    }).catch(function() {
      that.setData({ loaded: true });
    });
  },

  loadCredentials() {
    var that = this;
    return request.get(constants.API.CREDENTIALS).then(function(res) {
      var list = (res.list || res.credentials || []).map(normalizeCredential);
      var currentList = list.filter(function(item) { return item.isCurrent !== false; });
      var skillCertificates = currentList.filter(function(item) { return item.typeId === 'skill_cert'; });

      that.setData({
        credentials: currentList,
        requiredCredentialCards: buildUploadCards(REQUIRED_CREDENTIALS, currentList),
        conditionalCredentialCards: buildUploadCards(CONDITIONAL_CREDENTIALS, currentList),
        skillCertificates: skillCertificates,
        optionalCredentialCards: buildUploadCards(OPTIONAL_CREDENTIALS, currentList)
      });
    });
  },

  loadIndependentSkills() {
    var that = this;
    return request.get(constants.API.INDEPENDENT_SKILLS).then(function(res) {
      var skills = (res.skills || []).map(function(s) {
        var def = constants.INDEPENDENT_SKILLS.find(function(d) { return d.key === s.skillKey; });
        return {
          key: s.skillKey,
          label: def ? def.label : s.skillKey,
          isSelected: s.isSelected
        };
      });
      that.setData({ independentSkills: skills });
    }).catch(function() {
      // Use defaults
      var skills = constants.INDEPENDENT_SKILLS.map(function(s) {
        return { key: s.key, label: s.label, isSelected: false };
      });
      that.setData({ independentSkills: skills });
    });
  },

  loadSkillEntries() {
    var that = this;
    return request.get(constants.API.SKILL_ENTRIES).then(function(res) {
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
      // Use empty defaults
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

  // Independent skill toggle
  onIndependentSkillToggle(e) {
    var key = e.currentTarget.dataset.key;
    var skills = this.data.independentSkills.map(function(s) {
      if (s.key === key) {
        return { ...s, isSelected: !s.isSelected };
      }
      return s;
    });
    this.setData({ independentSkills: skills });

    // Save to server
    var payload = {
      skills: skills.map(function(s) {
        return { skillKey: s.key, isSelected: s.isSelected };
      })
    };
    request.put(constants.API.INDEPENDENT_SKILLS, payload).catch(function() {});
  },

  // Skill entry editing
  onEditSkillEntry(e) {
    var entryIndex = parseInt(e.currentTarget.dataset.index);
    var entry = this.data.skillEntries.find(function(en) { return en.entryIndex === entryIndex; });
    if (!entry) return;

    var relatedSkillOptions = constants.RELATED_SERVICE_SKILLS.map(function(rs) {
      return {
        ...rs,
        checked: (entry.relatedServiceSkills || []).indexOf(rs.value) > -1
      };
    });
    var relatedText = (entry.relatedServiceSkills || []).join('、');
    var existingFileIds = (entry.files || [])
      .map(function(f) { return f.fileAsset ? f.fileAsset.id : ''; })
      .filter(Boolean);

    this.setData({
      editingEntryIndex: entryIndex,
      editingEntry: entry,
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

    existingFileIds.forEach(function(fileId, index) {
      this.loadSkillEntryPreview(fileId, index);
    }, this);
  },

  loadSkillEntryPreview(fileId, index) {
    wx.downloadFile({
      url: constants.API_BASE_URL + '/app/files/' + fileId + '/preview',
      header: {
        Authorization: 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300 && res.tempFilePath) {
          var urls = this.data.editFileUrls || [];
          urls[index] = res.tempFilePath;
          this.setData({ editFileUrls: urls });
        }
      }
    });
  },

  onCancelEditEntry() {
    this.setData({ editingEntryIndex: -1, editingEntry: null });
    this.loadSkillEntries();
  },

  onEditSkillNameChange(e) {
    var index = parseInt(e.detail.value);
    var option = constants.CERTIFICATE_SKILL_OPTIONS[index];
    this.setData({
      editSkillNameIndex: index,
      editSkillName: option ? option.value : ''
    });
  },

  onEditSkillLevelChange(e) {
    var index = parseInt(e.detail.value);
    var option = constants.SKILL_LEVEL_OPTIONS[index];
    this.setData({
      editSkillLevelIndex: index,
      editSkillLevel: option ? option.value : ''
    });
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
      skills = [...skills, value];
    }
    this.setData({
      editRelatedSkills: skills,
      editRelatedSkillText: skills.join('、')
    });
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
                header: {
                  Authorization: 'Bearer ' + (wx.getStorageSync('token') || '')
                },
                success: function(uploadRes) {
                  try {
                    var data = JSON.parse(uploadRes.data);
                    var fileId = (data && data.data && data.data.id) || (data && data.id) || '';
                    if (fileId) {
                      uploadedIds.push(fileId);
                      uploadedUrls.push(file.tempFilePath);
                      resolve();
                    } else {
                      reject(new Error('上传失败'));
                    }
                  } catch (e) {
                    reject(e);
                  }
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
        if (res.confirm) {
          that.saveSkillEntry(entryIndex, false);
        }
      }
    });
  },

  onSaveSkillEntry() {
    var that = this;
    var entryIndex = this.data.editingEntryIndex;

    // Validate if filling
    var isFilling = !!(this.data.editSkillName && this.data.editSkillName.trim());
    if (isFilling) {
      if (!this.data.editSkillName) {
        wx.showToast({ title: '请选择技能名称', icon: 'none' });
        return;
      }
      if (!this.data.editSkillLevel) {
        wx.showToast({ title: '请选择等级', icon: 'none' });
        return;
      }
      var duration = parseInt(this.data.editWorkDuration);
      if (isNaN(duration) || duration < 1) {
        wx.showToast({ title: '相关工作时长必须为正整数（月）', icon: 'none' });
        return;
      }
      if (!this.data.editFiles || this.data.editFiles.length === 0) {
        wx.showToast({ title: '请上传至少1张证书图片', icon: 'none' });
        return;
      }
      if (this.data.editFiles.length > 3) {
        wx.showToast({ title: '最多上传3张证书图片', icon: 'none' });
        return;
      }

      // Check duplicate skill name
      var otherEntries = this.data.skillEntries.filter(function(e) { return e.entryIndex !== entryIndex; });
      var duplicate = otherEntries.find(function(e) { return e.skillName === that.data.editSkillName; });
      if (duplicate) {
        wx.showToast({ title: '技能名称「' + that.data.editSkillName + '」已在其他条目中使用', icon: 'none' });
        return;
      }
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
      that.setData({ editingEntryIndex: -1, editingEntry: null, editIsSubmitting: false });
      that.loadSkillEntries();
    }).catch(function(err) {
      console.error('保存技能条目失败', err);
      that.setData({ editIsSubmitting: false });
    });
  },

  // Navigation to credential types
  goToCredentialType(e) {
    var typeId = e.currentTarget.dataset.type;
    var typeName = e.currentTarget.dataset.name || getTypeLabel(typeId);
    var credentialId = e.currentTarget.dataset.id;

    if (credentialId) {
      wx.navigateTo({
        url: '/pages/credential/edit/index?id=' + credentialId
      });
      return;
    }

    wx.navigateTo({
      url: '/pages/credential/edit/index?typeId=' + typeId + '&typeName=' + encodeURIComponent(typeName)
    });
  },

  goToSkillCertUpload() {
    wx.navigateTo({
      url: '/pages/credential/edit/index?typeId=skill_cert&typeName=' + encodeURIComponent('技能证书')
    });
  },

  goToEdit(e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/credential/edit/index?id=' + id
    });
  },

  loadCredentialsQuiet() {
    this.loadCredentials();
  },

  handleSubmitReview() {
    if (this.data.isSubmitting) return;

    this.setData({ isSubmitting: true });
    var that = this;
    request.get(constants.API.INTAKE_PREVIEW).then(function(preview) {
      if (!preview.canSubmit) {
        var issues = preview.issues || [];
        wx.showModal({
          title: '资料不完整',
          content: issues.length > 0
            ? issues.slice(0, 5).join('\n')
            : '请先完善个人资料和必填证件后再提交审核。',
          showCancel: false
        });
        return Promise.reject(new Error('资料不完整'));
      }

      return new Promise(function(resolve, reject) {
        wx.showModal({
          title: '提交审核',
          content: '确认提交当前资料进入审核流程？',
          success: function(res) {
            if (res.confirm) {
              resolve();
            } else {
              reject(new Error('用户取消提交'));
            }
          },
          fail: reject
        });
      });
    }).then(function() {
      return request.post(constants.API.SUBMIT_INTAKE);
    }).then(function() {
      wx.showToast({
        title: '已提交审核',
        icon: 'success',
        duration: 1500
      });
      setTimeout(function() {
        wx.navigateBack();
      }, 1500);
    }).catch(function(err) {
      if (err && err.message !== '资料不完整' && err.message !== '用户取消提交') {
        console.error('提交审核失败', err);
      }
    }).finally(function() {
      that.setData({ isSubmitting: false });
    });
  }
});
