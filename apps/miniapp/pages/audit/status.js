const request = require('../../utils/request');
const constants = require('../../utils/constants');

Page({
  data: {
    intakeStatus: '',
    intakeStatusLabel: '',
    listingStatus: '',
    listingStatusLabel: '',
    auditRecords: [],
    currentStep: -1,
    loaded: false
  },

  onLoad() {
    this.loadAuditStatus();
  },

  onShow() {
    this.loadAuditStatus();
  },

  loadAuditStatus() {
    const that = this;
    request.get(constants.API.INTAKE_STATUS).then((res) => {
      const intakeStatus = res.intakeStatus || constants.INTAKE_STATUS.DRAFT;
      const listingStatus = res.listingStatus || constants.LISTING_STATUS.OFF;

      // 构建审核时间线
      const auditRecords = that.buildAuditRecords(intakeStatus, res.auditLog || []);

      that.setData({
        intakeStatus: intakeStatus,
        intakeStatusLabel: constants.INTAKE_STATUS_LABEL[intakeStatus] || '未知',
        listingStatus: listingStatus,
        listingStatusLabel: constants.LISTING_STATUS_LABEL[listingStatus] || '未知',
        auditRecords: auditRecords,
        currentStep: that.getCurrentStep(intakeStatus),
        loaded: true,
        rejectReason: res.rejectReason || '',
        reviewerRemark: res.reviewerRemark || ''
      });
    }).catch(() => {
      that.setData({ loaded: true });
    });
  },

  buildAuditRecords(status, logs) {
    const records = [];

    // 添加"提交申请"步骤
    records.push({
      title: '提交入驻申请',
      time: '',
      status: 'completed',
      desc: '提交个人信息和证件资料'
    });

    // 添加"审核中"步骤
    if (status === constants.INTAKE_STATUS.PENDING_REVIEW) {
      records.push({
        title: '审核中',
        time: '',
        status: 'active',
        desc: '工作人员正在审核您的资料'
      });
    } else if (status === constants.INTAKE_STATUS.APPROVED || status === constants.INTAKE_STATUS.REJECTED) {
      records.push({
        title: '审核中',
        time: '',
        status: 'completed',
        desc: '审核已完成'
      });
    } else if (status === constants.INTAKE_STATUS.INFO_REQUIRED) {
      records.push({
        title: '审核中',
        time: '',
        status: 'active',
        desc: '需要您补充资料'
      });
    } else {
      records.push({
        title: '审核中',
        time: '',
        status: 'pending',
        desc: '请先提交入驻申请'
      });
    }

    // 如果已通过或已驳回，添加最终状态
    if (status === constants.INTAKE_STATUS.APPROVED) {
      records.push({
        title: '审核通过',
        time: '',
        status: 'completed',
        desc: '恭喜您，入驻申请已通过审核'
      });
    } else if (status === constants.INTAKE_STATUS.REJECTED) {
      records.push({
        title: '审核驳回',
        time: '',
        status: 'rejected',
        desc: '入驻申请未通过审核'
      });
    } else {
      records.push({
        title: '审核通过',
        time: '',
        status: 'pending',
        desc: '待审核通过'
      });
    }

    // 如果已有审核日志，覆盖时间
    if (logs.length > 0) {
      logs.forEach((log, index) => {
        if (records[index]) {
          records[index].time = log.createdAt || '';
          records[index].desc = log.remark || records[index].desc;
        }
      });
    }

    return records;
  },

  getCurrentStep(status) {
    const map = {
      draft: 0,
      pending_review: 1,
      info_required: 1,
      approved: 2,
      rejected: 2
    };
    return map[status] !== undefined ? map[status] : 0;
  },

  // 如果被驳回，重新提交
  handleResubmit() {
    wx.navigateTo({
      url: '/pages/submit/index'
    });
  },

  // 补充资料
  handleSupplement() {
    wx.navigateTo({
      url: '/pages/profile/edit/index'
    });
  }
});
