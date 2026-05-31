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
  const values = list.map((item) => item.value || item.categoryId);
  return constants.SERVICE_SKILL_OPTIONS.every((item) => values.indexOf(item.value) > -1);
}

function logAvatarDebug(stage, payload) {
  console.log('[AvatarDebug][profile-edit][' + stage + ']', payload);
}

Page({
  data: {
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
    isEdit: false,
    avatarChanged: false
  },

  onLoad() {
    this.loadProfile();
    this.loadDictionaries();
  },

  loadProfile() {
    request.get(constants.API.PROFILE).then((res) => {
      if (res.profile) {
        const p = res.profile;
        const avatarValue = resolveAvatarValue(p, res);
        logAvatarDebug('loadProfile.profile', {
          rawProfileAvatarUrl: p.avatarUrl || '',
          rawProfileAvatarFileId: p.avatarFileId || '',
          rawRootAvatarUrl: res.avatarUrl || '',
          rawWechatAvatar: res.wechatAvatar || '',
          resolvedAvatarValue: avatarValue,
          normalizedAvatarUrl: normalizeAvatarUrl(avatarValue)
        });
        let genderIndex = -1;
        if (p.gender) {
          genderIndex = constants.GENDER_OPTIONS.findIndex((g) => g.value === p.gender);
        }
        this.setData({
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
        logAvatarDebug('loadProfile.noProfile', {
          rawRootAvatarUrl: res.avatarUrl || '',
          rawWechatAvatar: res.wechatAvatar || '',
          resolvedAvatarValue: avatarValue,
          normalizedAvatarUrl: normalizeAvatarUrl(avatarValue)
        });
        this.setData({
          phone: res.phone || '',
          avatarUrl: avatarValue,
          avatarFileId: avatarValue,
          avatarPreviewUrl: normalizeAvatarUrl(avatarValue),
          avatarText: getAvatarText('')
        });
      }
    }).catch(() => {
      // 新用户使用默认值
    });
  },

  loadDictionaries() {
    request.get(constants.API.SERVICE_CATEGORIES, { groups: 'service_category' }).then((res) => {
      const apiCategories = (res.service_category || []).map(normalizeCategory);
      const categories = hasExpectedServiceCategories(apiCategories)
        ? apiCategories
        : constants.SERVICE_SKILL_OPTIONS.map(normalizeCategory);
      this.setData({
        serviceCategories: categories
      });
    }).catch(() => {
      this.setData({
        serviceCategories: constants.SERVICE_SKILL_OPTIONS.map(normalizeCategory)
      });
    });

    request.get(constants.API.SERVICE_AREAS, { groups: 'service_area' }).then((res) => {
      this.setData({
        serviceAreas: constants.SERVICE_AREA_OPTIONS
      });
    }).catch(() => {
      this.setData({
        serviceAreas: constants.SERVICE_AREA_OPTIONS
      });
    });
  },

  handleAvatarUpload() {
    wx.showActionSheet({
      itemList: ['拍照上传', '从相册选择'],
      success: (res) => {
        const sourceType = res.tapIndex === 0 ? ['camera'] : ['album'];
        this.chooseAvatarAndUpload(sourceType);
      }
    });
  },

  chooseAvatarAndUpload(sourceType) {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType,
      sizeType: ['compressed'],
      success: (res) => {
        const tempFile = res.tempFiles[0];
        const filePath = tempFile.tempFilePath;

        wx.showLoading({
          title: '上传中...',
          mask: true
        });

        uploadUtil.uploadFile(
          constants.API.FILES_UPLOAD,
          filePath,
          'file',
          { purpose: 'avatar' }
        ).then((uploadRes) => {
          const fileId = extractUploadedFileId(uploadRes);
          if (!fileId) {
            logAvatarDebug('upload.noFileId', { uploadRes });
            wx.showToast({ title: '头像上传失败', icon: 'none' });
            return;
          }

          logAvatarDebug('upload.success', {
            fileId,
            localFilePath: filePath,
            uploadRes
          });
          this.setData({
            avatarUrl: fileId,
            avatarFileId: fileId,
            avatarPreviewUrl: filePath,
            avatarChanged: true
          });
          setCachedAvatarFileId(fileId, filePath);
          wx.showToast({
            title: '头像已上传',
            icon: 'success'
          });
        }).catch((err) => {
          console.error('头像上传失败', err);
        }).finally(() => {
          wx.hideLoading();
        });
      },
      fail: (err) => {
        if (err.errMsg && err.errMsg.indexOf('cancel') === -1) {
          wx.showToast({
            title: '选择图片失败',
            icon: 'none'
          });
        }
      }
    });
  },

  onNameInput(e) {
    const name = e.detail.value;
    this.setData({
      name,
      avatarText: getAvatarText(name)
    });
  },

  onAvatarImageLoad(e) {
    logAvatarDebug('image.load', {
      src: this.data.avatarPreviewUrl || this.data.avatarUrl,
      event: e.detail || {}
    });
  },

  onAvatarImageError(e) {
    logAvatarDebug('image.error', {
      src: this.data.avatarPreviewUrl || this.data.avatarUrl,
      event: e.detail || {}
    });
  },

  onBirthdayInput(e) {
    this.setData({ birthday: e.detail.value });
  },

  onAddressInput(e) {
    this.setData({ address: e.detail.value });
  },

  onEmergencyContactInput(e) {
    this.setData({ emergencyContact: e.detail.value });
  },

  onEmergencyPhoneInput(e) {
    this.setData({ emergencyPhone: e.detail.value });
  },

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
    this.setData({
      selectedCategories: e.detail.selectedValues || []
    });
  },

  onAreaChange(e) {
    this.setData({
      selectedAreas: e.detail.selectedValues || []
    });
  },

  validate() {
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

  async handleSave() {
    if (this.data.isSubmitting) return;
    if (!this.validate()) return;

    this.setData({ isSubmitting: true });

    try {
      const profileData = {
        name: this.data.name,
        gender: this.data.gender,
        birthday: this.data.birthday,
        avatarUrl: this.data.avatarFileId || this.data.avatarUrl,
        address: this.data.address,
        emergencyContact: this.data.emergencyContact,
        emergencyPhone: this.data.emergencyPhone
      };
      const avatarChanged = this.data.avatarChanged;
      const uploadedFileId = this.data.avatarFileId;

      logAvatarDebug('save.beforePut', {
        avatarChanged,
        uploadedFileId,
        profileAvatarUrl: profileData.avatarUrl,
        currentPreview: this.data.avatarPreviewUrl
      });
      const updatedProfile = await request.put(constants.API.PROFILE_UPDATE, profileData);
      const updatedAvatarValue = resolveAvatarValue(updatedProfile, updatedProfile);
      logAvatarDebug('save.afterPut', {
        updatedProfile,
        updatedAvatarValue,
        normalizedAvatarUrl: normalizeAvatarUrl(updatedAvatarValue)
      });
      if (updatedAvatarValue) {
        setCachedAvatarFileId(updatedAvatarValue);
      }

      if (this.data.selectedCategories.length > 0) {
        const skillsData = {
          skills: this.data.selectedCategories.map((c) => ({
            categoryId: c.categoryId || c.dictKey || c.id || c.value,
            categoryName: c.categoryName || c.dictValue || c.label || c.name,
            skillLevel: c.skillLevel || c.level,
            description: c.description || ''
          }))
        };
        await request.put(constants.API.PROFILE + '/skills', skillsData);
      }

      if (this.data.selectedAreas.length > 0) {
        const areasData = {
          areas: this.data.selectedAreas.map((a) => ({
            province: a.province || a.dictValue || a.label || a.name || '',
            city: a.city || '',
            district: a.district || ''
          }))
        };
        await request.put(constants.API.PROFILE + '/service-areas', areasData);
      }

      // When avatar was changed, post-save refresh is mandatory.
      if (avatarChanged) {
        try {
          const savedProfile = await request.get(constants.API.PROFILE);
          const profile = savedProfile.profile || {};
          const returnedAvatarUrl = resolveAvatarValue(profile, savedProfile);
          logAvatarDebug('save.afterRefresh', {
            savedProfile,
            returnedAvatarUrl,
            normalizedAvatarUrl: normalizeAvatarUrl(returnedAvatarUrl)
          });

          if (!returnedAvatarUrl || returnedAvatarUrl !== uploadedFileId) {
            console.error('[AvatarSaveConfirm] mismatch', {
              uploadedFileId: uploadedFileId,
              returnedAvatarUrl: returnedAvatarUrl
            });
            wx.showToast({ title: '头像未保存成功，请重试', icon: 'none' });
            this.setData({ isSubmitting: false });
            return;
          }

          this.setData({
            avatarUrl: returnedAvatarUrl,
            avatarFileId: returnedAvatarUrl,
            avatarPreviewUrl: normalizeAvatarUrl(returnedAvatarUrl),
            avatarChanged: false
          });
          setCachedAvatarFileId(returnedAvatarUrl);
        } catch (refreshErr) {
          console.error('[AvatarSaveConfirm] refresh failed', {
            uploadedFileId: uploadedFileId,
            error: (refreshErr && refreshErr.message) || refreshErr
          });
          wx.showToast({ title: '头像保存确认失败，请重试', icon: 'none' });
          this.setData({ isSubmitting: false });
          return;
        }
      } else {
        // No avatar change — refresh is best-effort, navigate back either way.
        try {
          const savedProfile = await request.get(constants.API.PROFILE);
          const profile = savedProfile.profile || {};
          const returnedAvatarUrl = resolveAvatarValue(profile, savedProfile);
          this.setData({
            avatarUrl: returnedAvatarUrl || '',
            avatarFileId: returnedAvatarUrl || '',
            avatarPreviewUrl: normalizeAvatarUrl(returnedAvatarUrl)
          });
        } catch (refreshErr) {
          // Non-critical when no avatar was changed; still navigate back.
        }
      }

      wx.showToast({
        title: '保存成功',
        icon: 'success',
        duration: 1500
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      console.error('保存失败', err);
    } finally {
      this.setData({ isSubmitting: false });
    }
  }
});
