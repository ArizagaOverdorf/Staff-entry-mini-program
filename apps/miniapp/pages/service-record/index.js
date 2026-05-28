const request = require('../../utils/request');
const constants = require('../../utils/constants');

const DEMO_RECORDS = [
  {
    id: 'demo-20260527',
    dateText: '2026/05/27',
    addressText: '佛山',
    projectText: '月嫂',
    durationText: '26天',
    amountText: '12000元',
    violationText: '否',
    violation: false
  }
];

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

function normalizeRecord(record) {
  const durationMinutes = record.serviceDurationMinutes || record.durationMinutes;
  const durationText = record.durationText || record.duration || (
    durationMinutes ? `${Math.round(durationMinutes / 144) / 10}天` : ''
  );
  const amount = record.amount || record.serviceAmount || record.orderAmount;
  const violation = !!(record.violation || record.isViolation || record.isDisputed);

  return {
    id: record.id || `${record.serviceDate || record.date}-${record.serviceProject || record.project}`,
    dateText: record.dateText || formatDate(record.serviceDate || record.date),
    addressText: record.addressText || record.serviceAddress || record.city || record.address || '未填写',
    projectText: record.projectText || record.serviceProject || record.project || record.serviceTypeName || '家政服务',
    durationText: durationText || '未填写',
    amountText: record.amountText || (amount ? `${amount}元` : '未填写'),
    violationText: violation ? '是' : '否',
    violation
  };
}

Page({
  data: {
    records: [],
    totalPages: 1,
    currentPage: 1,
    loaded: false,
    loading: false,
    hasMore: false,
    usingDemo: false
  },

  onLoad() {
    this.loadRecords(1);
  },

  loadRecords(page) {
    if (this.data.loading) return;
    this.setData({ loading: true });

    request.get(constants.API.SERVICE_RECORDS, { page, pageSize: 10 }).then((res) => {
      const list = (res.list || res.records || []).map(normalizeRecord);
      const records = page === 1 ? list : this.data.records.concat(list);

      this.setData({
        records: records.length > 0 ? records : DEMO_RECORDS,
        totalPages: res.totalPages || 1,
        currentPage: page,
        loaded: true,
        loading: false,
        hasMore: records.length > 0 && page < (res.totalPages || 1),
        usingDemo: records.length === 0
      });
    }).catch(() => {
      this.setData({
        records: page === 1 ? DEMO_RECORDS : this.data.records,
        loaded: true,
        loading: false,
        hasMore: false,
        usingDemo: page === 1
      });
    });
  },

  onReachBottom() {
    if (this.data.hasMore) {
      this.loadRecords(this.data.currentPage + 1);
    }
  }
});
