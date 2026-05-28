import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Table,
  Modal,
  InputNumber,
  DatePicker,
  Switch,
  Popconfirm,
  message,
  Tag,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  listServiceRecords,
  createServiceRecord,
  updateServiceRecord,
  deleteServiceRecord,
  type ServiceRecordItem,
  type CreateServiceRecordInput,
  type UpdateServiceRecordInput,
} from './services/service-record';
import { listStaff, type StaffRecord } from '../staff/services/staff';

const MINUTES_PER_DAY = 1440;

function minutesToDays(minutes?: number) {
  if (minutes == null) return undefined;
  return minutes / MINUTES_PER_DAY;
}

function daysToMinutes(days?: number) {
  if (days == null) return undefined;
  return Math.round(days * MINUTES_PER_DAY);
}

const ServiceRecordPage: React.FC = () => {
  const [data, setData] = useState<ServiceRecordItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form] = Form.useForm();
  const [modalForm] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [staffOptions, setStaffOptions] = useState<StaffRecord[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const params: any = {
        page,
        pageSize,
        staffKeyword: values.staffKeyword || undefined,
        serviceProject: values.serviceProject || undefined,
        isDisputed: values.isDisputed !== undefined ? values.isDisputed : undefined,
      };
      if (values.dateRange && values.dateRange.length === 2) {
        params.dateFrom = values.dateRange[0].format('YYYY-MM-DD');
        params.dateTo = values.dateRange[1].format('YYYY-MM-DD');
      }
      const result = await listServiceRecords(params);
      setData(result.list || []);
      setTotal(result.total || 0);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, form]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleReset = () => {
    form.resetFields();
    setPage(1);
    fetchData();
  };

  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
  };

  const openCreateModal = () => {
    setEditingId(null);
    modalForm.resetFields();
    modalForm.setFieldsValue({ isDisputed: false, recordSource: 'manual' });
    searchStaff('');
    setModalOpen(true);
  };

  const openEditModal = (record: ServiceRecordItem) => {
    setEditingId(record.id);
    modalForm.setFieldsValue({
      staffAccountId: record.staffAccountId,
      serviceDate: record.serviceDate ? dayjs(record.serviceDate) : undefined,
      externalOrderNo: record.externalOrderNo,
      serviceProject: record.serviceProject,
      serviceAddress: record.serviceAddress,
      serviceDurationDays: minutesToDays(record.serviceDurationMinutes),
      serviceAmount: record.serviceAmount,
      customerName: record.customerName,
      serviceDesc: record.serviceDesc,
      rating: record.rating,
      isDisputed: record.isDisputed,
      disputeResult: record.disputeResult,
      disputeRemark: record.disputeRemark,
    });
    setModalOpen(true);
  };

  const searchStaff = async (keyword: string) => {
    setStaffLoading(true);
    try {
      const result = await listStaff({
        page: 1,
        pageSize: 20,
        name: keyword || undefined,
      });
      setStaffOptions(result.list || []);
    } catch {
      setStaffOptions([]);
    } finally {
      setStaffLoading(false);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await modalForm.validateFields();
      setModalLoading(true);

      const dateStr = values.serviceDate
        ? values.serviceDate.format('YYYY-MM-DD')
        : undefined;

      if (editingId) {
        const input: UpdateServiceRecordInput = {
          serviceDate: dateStr,
          externalOrderNo: values.externalOrderNo,
          serviceProject: values.serviceProject,
          serviceAddress: values.serviceAddress,
          serviceDurationMinutes: daysToMinutes(values.serviceDurationDays),
          serviceAmount: values.serviceAmount,
          customerName: values.customerName,
          serviceDesc: values.serviceDesc,
          rating: values.rating,
          isDisputed: values.isDisputed,
          disputeResult: values.disputeResult,
          disputeRemark: values.disputeRemark,
        };
        await updateServiceRecord(editingId, input);
        message.success('更新成功');
      } else {
        const input: CreateServiceRecordInput = {
          staffAccountId: values.staffAccountId,
          serviceDate: dateStr,
          externalOrderNo: values.externalOrderNo,
          serviceProject: values.serviceProject,
          serviceAddress: values.serviceAddress,
          serviceDurationMinutes: daysToMinutes(values.serviceDurationDays),
          serviceAmount: values.serviceAmount,
          customerName: values.customerName,
          serviceDesc: values.serviceDesc,
          rating: values.rating,
          isDisputed: values.isDisputed,
          disputeResult: values.disputeResult,
          disputeRemark: values.disputeRemark,
          recordSource: 'manual',
        };
        await createServiceRecord(input);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchData();
    } catch {
      // validation error or API error
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteServiceRecord(id);
      message.success('删除成功');
      fetchData();
    } catch {
      // handled by interceptor
    }
  };

  const columns: ColumnsType<ServiceRecordItem> = [
    {
      title: '服务人员',
      dataIndex: 'staffName',
      key: 'staffName',
      width: 100,
      render: (_: any, record: ServiceRecordItem) =>
        record.staffName !== '-' ? record.staffName : record.staffId || '-',
    },
    {
      title: '服务日期',
      dataIndex: 'serviceDate',
      key: 'serviceDate',
      width: 110,
      render: (v: string) => (v ? dayjs(v).format('YYYY/MM/DD') : '-'),
    },
    {
      title: '服务项目',
      dataIndex: 'serviceProject',
      key: 'serviceProject',
      width: 120,
      render: (v: string) => v || '-',
    },
    {
      title: '服务地址',
      dataIndex: 'serviceAddress',
      key: 'serviceAddress',
      width: 140,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '客户姓名',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 100,
      render: (v: string) => v || '-',
    },
    {
      title: '时长(天)',
      dataIndex: 'serviceDurationMinutes',
      key: 'serviceDurationMinutes',
      width: 90,
      render: (v: number) => (v != null ? `${minutesToDays(v)}天` : '-'),
    },
    {
      title: '金额',
      dataIndex: 'serviceAmount',
      key: 'serviceAmount',
      width: 90,
      render: (v: number) => (v != null ? `${v}元` : '-'),
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 70,
      render: (v: number) => (v != null ? `${v}/5` : '-'),
    },
    {
      title: '是否违规',
      dataIndex: 'isDisputed',
      key: 'isDisputed',
      width: 90,
      render: (v: boolean) =>
        v ? <Tag color="red">是</Tag> : <Tag color="green">否</Tag>,
    },
    {
      title: '外部单号',
      dataIndex: 'externalOrderNo',
      key: 'externalOrderNo',
      width: 130,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '服务描述',
      dataIndex: 'serviceDesc',
      key: 'serviceDesc',
      width: 150,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      fixed: 'right',
      render: (_: any, record: ServiceRecordItem) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该服务记录？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>服务记录</h2>
      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline">
          <Form.Item name="staffKeyword" label="服务人员">
            <Input placeholder="姓名/staffId/手机号" allowClear style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name="serviceProject" label="服务项目">
            <Input placeholder="请输入服务项目" allowClear style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="dateRange" label="服务日期">
            <DatePicker.RangePicker
              placeholder={['开始日期', '结束日期']}
              style={{ width: 240 }}
            />
          </Form.Item>
          <Form.Item name="isDisputed" label="是否违规">
            <Select
              placeholder="请选择"
              allowClear
              style={{ width: 100 }}
              options={[
                { label: '是', value: true },
                { label: '否', value: false },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                查询
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
      <Card
        title="服务记录列表"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新增记录
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: handlePageChange,
          }}
        />
      </Card>

      <Modal
        title={editingId ? '编辑服务记录' : '新增服务记录'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        confirmLoading={modalLoading}
        width={640}
        destroyOnClose
      >
        <Form form={modalForm} layout="vertical" style={{ marginTop: 16 }}>
          {!editingId && (
            <Form.Item
              name="staffAccountId"
              label="服务人员"
              rules={[{ required: true, message: '请选择服务人员' }]}
            >
              <Select
                showSearch
                filterOption={false}
                placeholder="搜索姓名后选择服务人员"
                loading={staffLoading}
                onSearch={searchStaff}
                options={staffOptions.map((staff) => ({
                  value: staff.id,
                  label: `${staff.name || '-'} / ${staff.staffId} / ${staff.phone || '-'}`,
                }))}
              />
            </Form.Item>
          )}
          <Form.Item name="serviceDate" label="服务日期">
            <DatePicker style={{ width: '100%' }} placeholder="请选择服务日期" />
          </Form.Item>
          <Form.Item name="serviceProject" label="服务项目">
            <Input placeholder="如：月嫂、育儿嫂、家庭保洁" />
          </Form.Item>
          <Form.Item name="serviceAddress" label="服务地址">
            <Input placeholder="如：佛山、广州天河区" maxLength={255} />
          </Form.Item>
          <Form.Item name="externalOrderNo" label="外部单号">
            <Input placeholder="外部订单编号" />
          </Form.Item>
          <Form.Item name="customerName" label="客户姓名">
            <Input placeholder="客户姓名" />
          </Form.Item>
          <Form.Item name="serviceDurationDays" label="服务时长(天)">
            <InputNumber min={0.5} precision={1} placeholder="天数" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="serviceAmount" label="服务金额">
            <InputNumber min={0} precision={2} placeholder="金额，单位元" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="serviceDesc" label="服务描述">
            <Input.TextArea rows={2} placeholder="服务内容描述" maxLength={500} />
          </Form.Item>
          <Form.Item name="rating" label="评分(1-5)">
            <InputNumber min={1} max={5} placeholder="1-5" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="isDisputed" label="是否违规" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="disputeResult" label="违规结果">
            <Input placeholder="违规结果" />
          </Form.Item>
          <Form.Item name="disputeRemark" label="违规备注">
            <Input.TextArea rows={2} placeholder="违规备注" maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ServiceRecordPage;
