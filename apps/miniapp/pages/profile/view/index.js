const request = require('../../../utils/request');
const constants = require('../../../utils/constants');

function getGenderLabel(value) {
  const option = constants.GENDER_OPTIONS.find((g) => g.value === value);
  return option ? option.label : '未设置';
}

function getAvatarText(name) {
  return name ? name.slice(0, 1) : '人';
}

function formatNames(items, key) {
  if (!items || items.length === 0) return '';
  return items.map((item) => item[key]).filter(Boolean).join('、');
}

function formatAreas(areas) {
  if (!areas || areas.length === 0) return '';
  return areas
    .map((area) => [area.province, area.city, area.district].filter(Boolean).join(''))
    .filter(Boolean)
    .join('、');
}

Page({
  data: {
    profile: {},
    avatarText: '人',
    loaded: false
  },

  onLoad() {
    this.loadProfile();
  },

  onShow() {
    this.loadProfile();
  },

  loadProfile() {
    request.get(constants.API.PROFILE).then((res) => {
      const profile = res.profile || {};
      this.setData({
        profile: {
          ...profile,
          phone: profile.phone || res.phone || '',
          genderLabel: getGenderLabel(profile.gender),
          serviceCategoryNames: formatNames(profile.serviceCategories, 'categoryName'),
          serviceAreaNames: formatAreas(profile.serviceAreas)
        },
        avatarText: getAvatarText(profile.name || profile.nameMasked || ''),
        loaded: true
      });
    }).catch(() => {
      this.setData({ loaded: true });
    });
  },

  goToEdit() {
    wx.navigateTo({
      url: '/pages/profile/edit/index'
    });
  }
});
