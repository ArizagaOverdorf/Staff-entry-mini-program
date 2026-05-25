/**
 * 服务区域选择组件
 * 支持多选服务区域
 */
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
    selected: [],
    displayText: '请选择服务区域'
  },

  observers: {
    'selectedValues': function (val) {
      if (val && val.length > 0) {
        this.setData({
          selected: val,
          displayText: val.length + ' 个区域已选'
        });
      } else {
        this.setData({
          selected: [],
          displayText: '请选择服务区域'
        });
      }
    }
  },

  methods: {
    // 打开选择弹窗
    openPicker() {
      this.setData({
        showPopup: true,
        selected: [...this.data.selectedValues]
      });
    },

    // 关闭弹窗
    closePicker() {
      this.setData({
        showPopup: false
      });
    },

    // 切换选项
    toggleItem(e) {
      const value = e.currentTarget.dataset.value;
      let selected = this.data.selected;
      const index = selected.indexOf(value);
      if (index > -1) {
        selected.splice(index, 1);
      } else {
        selected.push(value);
      }
      this.setData({
        selected: selected
      });
    },

    // 确认选择
    confirm() {
      this.setData({
        showPopup: false,
        displayText: this.data.selected.length > 0
          ? this.data.selected.length + ' 个区域已选'
          : '请选择服务区域'
      });
      this.triggerEvent('change', {
        selectedValues: this.data.selected
      });
    },

    // 清除选择
    clear() {
      this.setData({
        selected: [],
        displayText: '请选择服务区域'
      });
      this.triggerEvent('change', {
        selectedValues: []
      });
    },

    // 阻止冒泡
    noop() {}
  }
});
