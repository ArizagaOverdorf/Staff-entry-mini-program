function normalizeCategory(item) {
  const value = item.value || item.categoryId || item.dictKey || item.id;
  const label = item.label || item.categoryName || item.dictValue || item.name || value;
  return {
    ...item,
    value,
    label,
    categoryId: item.categoryId || item.dictKey || item.value || item.id,
    categoryName: item.categoryName || item.dictValue || item.label || item.name || label
  };
}

function getValue(item) {
  return typeof item === 'string'
    ? item
    : item.value || item.categoryId || item.dictKey || item.id;
}

Component({
  properties: {
    categories: {
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
    normalizedCategories: [],
    displayText: '请选择服务类别'
  },

  observers: {
    'categories, selectedValues': function () {
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
      const normalizedCategories = (this.data.categories || [])
        .map(normalizeCategory)
        .filter((item) => item.value)
        .map((item) => ({
          ...item,
          checked: selectedIds.indexOf(item.value) > -1
        }));

      this.setData({
        selectedIds,
        normalizedCategories,
        displayText: selectedIds.length > 0 ? selectedIds.length + ' 项已选' : '请选择服务类别'
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
        normalizedCategories: this.data.normalizedCategories.map((item) => ({
          ...item,
          checked: selectedIds.indexOf(item.value) > -1
        }))
      });
    },

    confirm() {
      const selectedValues = this.data.normalizedCategories
        .filter((item) => this.data.selectedIds.indexOf(item.value) > -1)
        .map((item) => ({
          value: item.value,
          label: item.label,
          categoryId: item.categoryId,
          categoryName: item.categoryName
        }));

      this.setData({
        showPopup: false,
        displayText: selectedValues.length > 0 ? selectedValues.length + ' 项已选' : '请选择服务类别'
      });
      this.triggerEvent('change', { selectedValues });
    },

    clear() {
      this.setData({
        selectedIds: [],
        normalizedCategories: this.data.normalizedCategories.map((item) => ({
          ...item,
          checked: false
        })),
        displayText: '请选择服务类别'
      });
      this.triggerEvent('change', { selectedValues: [] });
    },

    noop() {}
  }
});
