const request = require('../../../utils/request');
const constants = require('../../../utils/constants');

Page({
  data: {
    name: '',
    idNumber: '',
    gender: '',
    genderIndex: -1,
    birthday: '',
    phone: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    genderOptions: constants.GENDER_OPTIONS,
    serviceCategories: [],
    selectedCategories: [],
    serviceAreas: [],
    selectedAreas: [],
    isSubmitting: false,
    isEdit: false
  },

  onLoad() {
    this.loadProfile();
    this.loadDictionaries();
  },

  loadProfile() {
    const that = this;
    request.get(constants.API.PROFILE).then((res) => {
      if (res.profile) {
        const p = res.profile;
        let genderIndex = -1;
        if (p.gender) {
          genderIndex = constants.GENDER_OPTIONS.findIndex(g => g.value === p.gender);
        }
        that.setData({
          name: p.name || '',
          idNumber: p.idNumber || '',
          gender: p.gender || '',
          genderIndex: genderIndex,
          birthday: p.birthday || '',
          phone: p.phone || '',
          address: p.address || '',
          emergencyContact: p.emergencyContact || '',
          emergencyPhone: p.emergencyPhone || '',
          selectedCategories: p.serviceCategories || [],
          selectedAreas: p.serviceAreas || [],
          isEdit: true
        });
      }
    }).catch(() => {
      // 新用户，使用默认值
    });
  },

  loadDictionaries() {
    const that = this;
    // 加载服务类别
    request.get(constants.API.SERVICE_CATEGORIES, { groups: 'service_category' }).then((res) => {
      that.setData({
        serviceCategories: res.service_category || []
      });
    }).catch(() => {});

    // 加载服务区域
    request.get(constants.API.SERVICE_AREAS, { groups: 'service_area' }).then((res) => {
      that.setData({
        serviceAreas: res.service_area || []
      });
    }).catch(() => {});
  },

  // 输入处理
  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onIdNumberInput(e) {
    this.setData({ idNumber: e.detail.value });
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

  // 性别选择
  onGenderChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      genderIndex: index,
      gender: constants.GENDER_OPTIONS[index].value
    });
  },

  // 类别选择
  onCategoryChange(e) {
    this.setData({
      selectedCategories: e.detail.selectedValues || []
    });
  },

  // 区域选择
  onAreaChange(e) {
    this.setData({
      selectedAreas: e.detail.selectedValues || []
    });
  },

  // 表单校验
  validate() {
    if (!this.data.name) {
      wx.showToast({ title: '请输入姓名', icon: 'none' });
      return false;
    }
    if (!this.data.idNumber) {
      wx.showToast({ title: '请输入身份证号', icon: 'none' });
      return false;
    }
    if (this.data.idNumber.length !== 18) {
      wx.showToast({ title: '身份证号格式不正确', icon: 'none' });
      return false;
    }
    if (this.data.genderIndex < 0) {
      wx.showToast({ title: '请选择性别', icon: 'none' });
      return false;
    }
    return true;
  },

  // 保存提交
  handleSave() {
    if (this.data.isSubmitting) return;

    if (!this.validate()) return;

    this.setData({ isSubmitting: true });

    const profileData = {
      name: this.data.name,
      idNumber: this.data.idNumber,
      gender: this.data.gender,
      birthday: this.data.birthday,
      address: this.data.address,
      emergencyContact: this.data.emergencyContact,
      emergencyPhone: this.data.emergencyPhone,
      serviceCategories: this.data.selectedCategories,
      serviceAreas: this.data.selectedAreas
    };

    const that = this;
    request.post(constants.API.PROFILE_UPDATE, profileData).then((res) => {
      wx.showToast({
        title: '保存成功',
        icon: 'success',
        duration: 1500
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }).catch((err) => {
      console.error('保存失败', err);
    }).finally(() => {
      that.setData({ isSubmitting: false });
    });
  }
});
