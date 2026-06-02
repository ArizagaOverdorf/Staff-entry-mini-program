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

const ADDRESS_REGION_OPTIONS = [
  { label: '国内', type: 'domestic', cities: ['全国'] },
  { label: '国外', type: 'direct', cities: ['国外'] },
  { label: '港澳', type: 'group', cities: ['香港', '澳门'] },
  { label: '北京市', cities: ['北京市'] },
  { label: '天津市', cities: ['天津市'] },
  { label: '河北省', cities: ['石家庄市', '唐山市', '秦皇岛市', '邯郸市', '邢台市', '保定市', '张家口市', '承德市', '沧州市', '廊坊市', '衡水市'] },
  { label: '山西省', cities: ['太原市', '大同市', '阳泉市', '长治市', '晋城市', '朔州市', '晋中市', '运城市', '忻州市', '临汾市', '吕梁市'] },
  { label: '内蒙古自治区', cities: ['呼和浩特市', '包头市', '乌海市', '赤峰市', '通辽市', '鄂尔多斯市', '呼伦贝尔市', '巴彦淖尔市', '乌兰察布市', '兴安盟', '锡林郭勒盟', '阿拉善盟'] },
  { label: '辽宁省', cities: ['沈阳市', '大连市', '鞍山市', '抚顺市', '本溪市', '丹东市', '锦州市', '营口市', '阜新市', '辽阳市', '盘锦市', '铁岭市', '朝阳市', '葫芦岛市'] },
  { label: '吉林省', cities: ['长春市', '吉林市', '四平市', '辽源市', '通化市', '白山市', '松原市', '白城市', '延边朝鲜族自治州'] },
  { label: '黑龙江省', cities: ['哈尔滨市', '齐齐哈尔市', '鸡西市', '鹤岗市', '双鸭山市', '大庆市', '伊春市', '佳木斯市', '七台河市', '牡丹江市', '黑河市', '绥化市', '大兴安岭地区'] },
  { label: '上海市', cities: ['上海市'] },
  { label: '江苏省', cities: ['南京市', '无锡市', '徐州市', '常州市', '苏州市', '南通市', '连云港市', '淮安市', '盐城市', '扬州市', '镇江市', '泰州市', '宿迁市'] },
  { label: '浙江省', cities: ['杭州市', '宁波市', '温州市', '嘉兴市', '湖州市', '绍兴市', '金华市', '衢州市', '舟山市', '台州市', '丽水市'] },
  { label: '安徽省', cities: ['合肥市', '芜湖市', '蚌埠市', '淮南市', '马鞍山市', '淮北市', '铜陵市', '安庆市', '黄山市', '滁州市', '阜阳市', '宿州市', '六安市', '亳州市', '池州市', '宣城市'] },
  { label: '福建省', cities: ['福州市', '厦门市', '莆田市', '三明市', '泉州市', '漳州市', '南平市', '龙岩市', '宁德市'] },
  { label: '江西省', cities: ['南昌市', '景德镇市', '萍乡市', '九江市', '新余市', '鹰潭市', '赣州市', '吉安市', '宜春市', '抚州市', '上饶市'] },
  { label: '山东省', cities: ['济南市', '青岛市', '淄博市', '枣庄市', '东营市', '烟台市', '潍坊市', '济宁市', '泰安市', '威海市', '日照市', '临沂市', '德州市', '聊城市', '滨州市', '菏泽市'] },
  { label: '河南省', cities: ['郑州市', '开封市', '洛阳市', '平顶山市', '安阳市', '鹤壁市', '新乡市', '焦作市', '濮阳市', '许昌市', '漯河市', '三门峡市', '南阳市', '商丘市', '信阳市', '周口市', '驻马店市'] },
  { label: '湖北省', cities: ['武汉市', '黄石市', '十堰市', '宜昌市', '襄阳市', '鄂州市', '荆门市', '孝感市', '荆州市', '黄冈市', '咸宁市', '随州市', '恩施土家族苗族自治州'] },
  { label: '湖南省', cities: ['长沙市', '株洲市', '湘潭市', '衡阳市', '邵阳市', '岳阳市', '常德市', '张家界市', '益阳市', '郴州市', '永州市', '怀化市', '娄底市', '湘西土家族苗族自治州'] },
  { label: '广东省', cities: ['广州市', '深圳市', '珠海市', '汕头市', '佛山市', '韶关市', '湛江市', '肇庆市', '江门市', '茂名市', '惠州市', '梅州市', '汕尾市', '河源市', '阳江市', '清远市', '东莞市', '中山市', '潮州市', '揭阳市', '云浮市'] },
  { label: '广西壮族自治区', cities: ['南宁市', '柳州市', '桂林市', '梧州市', '北海市', '防城港市', '钦州市', '贵港市', '玉林市', '百色市', '贺州市', '河池市', '来宾市', '崇左市'] },
  { label: '海南省', cities: ['海口市', '三亚市', '三沙市', '儋州市'] },
  { label: '重庆市', cities: ['重庆市'] },
  { label: '四川省', cities: ['成都市', '自贡市', '攀枝花市', '泸州市', '德阳市', '绵阳市', '广元市', '遂宁市', '内江市', '乐山市', '南充市', '眉山市', '宜宾市', '广安市', '达州市', '雅安市', '巴中市', '资阳市', '阿坝藏族羌族自治州', '甘孜藏族自治州', '凉山彝族自治州'] },
  { label: '贵州省', cities: ['贵阳市', '六盘水市', '遵义市', '安顺市', '毕节市', '铜仁市', '黔西南布依族苗族自治州', '黔东南苗族侗族自治州', '黔南布依族苗族自治州'] },
  { label: '云南省', cities: ['昆明市', '曲靖市', '玉溪市', '保山市', '昭通市', '丽江市', '普洱市', '临沧市', '楚雄彝族自治州', '红河哈尼族彝族自治州', '文山壮族苗族自治州', '西双版纳傣族自治州', '大理白族自治州', '德宏傣族景颇族自治州', '怒江傈僳族自治州', '迪庆藏族自治州'] },
  { label: '西藏自治区', cities: ['拉萨市', '日喀则市', '昌都市', '林芝市', '山南市', '那曲市', '阿里地区'] },
  { label: '陕西省', cities: ['西安市', '铜川市', '宝鸡市', '咸阳市', '渭南市', '延安市', '汉中市', '榆林市', '安康市', '商洛市'] },
  { label: '甘肃省', cities: ['兰州市', '嘉峪关市', '金昌市', '白银市', '天水市', '武威市', '张掖市', '平凉市', '酒泉市', '庆阳市', '定西市', '陇南市', '临夏回族自治州', '甘南藏族自治州'] },
  { label: '青海省', cities: ['西宁市', '海东市', '海北藏族自治州', '黄南藏族自治州', '海南藏族自治州', '果洛藏族自治州', '玉树藏族自治州', '海西蒙古族藏族自治州'] },
  { label: '宁夏回族自治区', cities: ['银川市', '石嘴山市', '吴忠市', '固原市', '中卫市'] },
  { label: '新疆维吾尔自治区', cities: ['乌鲁木齐市', '克拉玛依市', '吐鲁番市', '哈密市', '昌吉回族自治州', '博尔塔拉蒙古自治州', '巴音郭楞蒙古自治州', '阿克苏地区', '克孜勒苏柯尔克孜自治州', '喀什地区', '和田地区', '伊犁哈萨克自治州', '塔城地区', '阿勒泰地区'] },
  { label: '台湾省', cities: ['台北市', '新北市', '桃园市', '台中市', '台南市', '高雄市', '基隆市', '新竹市', '嘉义市'] }
];

function getDomesticProvinceOptions() {
  return ADDRESS_REGION_OPTIONS.filter(function(item) {
    return !item.type;
  }).map(function(item) {
    return item.label;
  });
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
    addressSelectorVisible: false,
    addressRegionOptions: ADDRESS_REGION_OPTIONS,
    addressRegionIndex: 0,
    addressCityOptions: getDomesticProvinceOptions(),
    addressCityTitle: '选择省份',
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
    isAutoSaving: false,
    autoSaveStatus: '',
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

  onUnload() {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
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
            that.saveProfileSilently();
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

  onProfileFieldBlur() {
    this.scheduleAutoSave(0);
  },

  onAvatarImageLoad(e) {
    logAvatarDebug('image.load', { src: this.data.avatarPreviewUrl || this.data.avatarUrl, event: e.detail || {} });
  },

  onAvatarImageError(e) {
    logAvatarDebug('image.error', { src: this.data.avatarPreviewUrl || this.data.avatarUrl, event: e.detail || {} });
  },

  onOpenAddressSelector() {
    this.setData({
      addressSelectorVisible: true,
      addressRegionIndex: 0,
      addressCityOptions: getDomesticProvinceOptions(),
      addressCityTitle: '选择省份'
    });
  },

  onCloseAddressSelector() {
    this.setData({ addressSelectorVisible: false });
  },

  noop() {},

  onAddressRegionSelect(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    const region = this.data.addressRegionOptions[index];
    if (!region) return;
    const isDomestic = region.type === 'domestic';
    this.setData({
      addressRegionIndex: index,
      addressCityOptions: isDomestic ? getDomesticProvinceOptions() : (region.cities || []),
      addressCityTitle: isDomestic ? '选择省份' : '选择城市'
    });
  },

  onAddressCitySelect(e) {
    const value = e.currentTarget.dataset.value;
    const region = this.data.addressRegionOptions[this.data.addressRegionIndex];
    if (!region || !value) return;

    if (region.type === 'domestic') {
      const provinceIndex = this.data.addressRegionOptions.findIndex(function(item) {
        return item.label === value;
      });
      const province = this.data.addressRegionOptions[provinceIndex];
      if (province) {
        this.setData({
          addressRegionIndex: provinceIndex,
          addressCityOptions: province.cities || [],
          addressCityTitle: '选择城市'
        });
      }
      return;
    }

    const address = region.type === 'direct'
      ? value
      : region.type === 'group'
        ? value
        : region.label + ' ' + value;
    this.setData({
      address,
      addressSelectorVisible: false
    });
    this.scheduleAutoSave(0);
  },

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
    this.scheduleAutoSave(0);
  },

  onCategoryChange(e) {
    this.setData({ selectedCategories: e.detail.selectedValues || [] });
    this.scheduleAutoSave(0);
  },

  onAreaChange(e) {
    this.setData({ selectedAreas: e.detail.selectedValues || [] });
    this.scheduleAutoSave(0);
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

  // ──────────── Auto-save profile ────────────

  scheduleAutoSave(delay) {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
    this.autoSaveTimer = setTimeout(() => {
      this.autoSaveTimer = null;
      this.saveProfileSilently();
    }, delay == null ? 700 : delay);
  },

  saveProfileSilently() {
    return this.saveProfile({ silent: true }).catch(function() {});
  },

  flushAutoSave() {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    return this.saveProfile({ silent: true });
  },

  saveProfile(options) {
    var that = this;
    var opts = options || {};
    if (this.data.isSaving) {
      return this.profileSavePromise || Promise.resolve();
    }

    this.setData({ isSaving: true, isAutoSaving: true, autoSaveStatus: '保存中...' });

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

    this.profileSavePromise = request.put(constants.API.PROFILE_UPDATE, profileData).then(function(updatedProfile) {
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
      that.setData({ autoSaveStatus: '已自动保存' });
      if (!opts.silent) {
        wx.showToast({ title: '保存成功', icon: 'success' });
      }
    }).catch(function(err) {
      if (err) { console.error('保存失败', err); }
      that.setData({ autoSaveStatus: '保存失败，请稍后重试' });
      throw err;
    }).finally(function() {
      that.setData({ isSaving: false, isAutoSaving: false });
      that.profileSavePromise = null;
    });

    return this.profileSavePromise;
  },

  // ──────────── Submit review ────────────

  handleSubmitReview() {
    var that = this;
    if (this.data.isSubmitting) return;

    this.setData({ isSubmitting: true });
    this.flushAutoSave().then(function() {
      return request.get(constants.API.INTAKE_PREVIEW);
    }).then(function(preview) {
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
