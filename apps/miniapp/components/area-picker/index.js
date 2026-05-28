function makeCityItem(province, city) {
  return {
    value: province + '_' + city,
    label: city,
    province,
    city,
    district: ''
  };
}

function normalizeFlatArea(item) {
  const regionValue = [item.province, item.city, item.district].filter(Boolean).join('_');
  const value = regionValue || item.value || item.areaId || item.dictKey || item.id;
  const label = item.label || item.areaName || item.dictValue || item.name || [item.province, item.city, item.district].filter(Boolean).join('');
  return {
    value,
    label,
    province: item.province || label,
    city: item.city || '',
    district: item.district || ''
  };
}

function getValue(item) {
  if (typeof item === 'string') return item;
  const regionValue = [item.province, item.city, item.district].filter(Boolean).join('_');
  return regionValue || item.value || item.areaId || item.dictKey || item.id;
}

function buildAreaGroups(areas, selectedIds) {
  const special = [];
  const groups = [];

  (areas || []).forEach((area) => {
    if (area.cities && area.cities.length) {
      groups.push({
        title: area.province,
        children: area.cities.map((city) => {
          const item = makeCityItem(area.province, city);
          return {
            ...item,
            checked: selectedIds.indexOf(item.value) > -1
          };
        })
      });
      return;
    }

    const item = normalizeFlatArea(area);
    const target = area.type === 'special' || item.value === 'nationwide' || item.value === 'foreign'
      ? special
      : groups;

    if (target === special) {
      special.push({
        ...item,
        checked: selectedIds.indexOf(item.value) > -1
      });
    } else {
      groups.push({
        title: item.province || item.label,
        children: [{
          ...item,
          checked: selectedIds.indexOf(item.value) > -1
        }]
      });
    }
  });

  if (special.length) {
    groups.unshift({
      title: '常用',
      children: special
    });
  }

  return groups;
}

Component({
  properties: {
    areas: {
      type: Array,
      value: []
    },
    selectedValues: {
      type: Array,
      value: []
    }
  },

  data: {
    showPopup: false,
    selectedIds: [],
    areaGroups: [],
    displayText: '请选择服务区域'
  },

  observers: {
    'areas, selectedValues': function () {
      this.refreshOptions();
    }
  },

  lifetimes: {
    attached() {
      this.refreshOptions();
    }
  },

  methods: {
    refreshOptions() {
      const selectedIds = (this.data.selectedValues || [])
        .map(getValue)
        .filter(Boolean);

      this.setData({
        selectedIds,
        areaGroups: buildAreaGroups(this.data.areas, selectedIds),
        displayText: selectedIds.length > 0 ? selectedIds.length + ' 个区域已选' : '请选择服务区域'
      });
    },

    openPicker() {
      this.setData({ showPopup: true });
      this.refreshOptions();
    },

    closePicker() {
      this.setData({ showPopup: false });
    },

    toggleItem(e) {
      const value = e.currentTarget.dataset.value;
      let selectedIds = [...this.data.selectedIds];
      const index = selectedIds.indexOf(value);

      if (index > -1) {
        selectedIds.splice(index, 1);
      } else {
        selectedIds.push(value);
      }

      this.setData({
        selectedIds,
        areaGroups: this.data.areaGroups.map((group) => ({
          ...group,
          children: group.children.map((item) => ({
            ...item,
            checked: selectedIds.indexOf(item.value) > -1
          }))
        }))
      });
    },

    confirm() {
      const selectedValues = [];
      this.data.areaGroups.forEach((group) => {
        group.children.forEach((item) => {
          if (this.data.selectedIds.indexOf(item.value) > -1) {
            selectedValues.push({
              value: item.value,
              label: item.label,
              province: item.province,
              city: item.city,
              district: item.district
            });
          }
        });
      });

      this.setData({
        showPopup: false,
        displayText: selectedValues.length > 0 ? selectedValues.length + ' 个区域已选' : '请选择服务区域'
      });
      this.triggerEvent('change', { selectedValues });
    },

    clear() {
      this.setData({
        selectedIds: [],
        areaGroups: this.data.areaGroups.map((group) => ({
          ...group,
          children: group.children.map((item) => ({
            ...item,
            checked: false
          }))
        })),
        displayText: '请选择服务区域'
      });
      this.triggerEvent('change', { selectedValues: [] });
    },

    noop() {}
  }
});
