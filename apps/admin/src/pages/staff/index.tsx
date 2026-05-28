import React, { useState, useEffect, useCallback } from 'react';
import { Card, Form, Input, Select, Button, Space, Checkbox, Modal, message } from 'antd';
import { SearchOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
import StaffTable from './components/StaffTable';
import { listStaff, cleanupDraftStaff, type StaffRecord } from './services/staff';

const StaffList: React.FC = () => {
  const [data, setData] = useState<StaffRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form] = Form.useForm();
  const [includeDraft, setIncludeDraft] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const params = {
        page,
        pageSize,
        ...values,
        includeDraft,
      };
      const result = await listStaff(params);
      setData(result.list || []);
      setTotal(result.total || 0);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, form, includeDraft]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleReset = () => {
    form.resetFields();
    setIncludeDraft(false);
    setPage(1);
    fetchData();
  };

  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
  };

  const handleCleanup = () => {
    Modal.confirm({
      title: '确认清理',
      content: '将清理7天前的草稿记录，此操作不可撤销，确认继续？',
      okText: '确认清理',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        setCleaning(true);
        try {
          const result = await cleanupDraftStaff();
          message.success(`已清理 ${result.cleaned} 条草稿记录`);
          setPage(1);
          fetchData();
        } catch {
          // handled by interceptor
        } finally {
          setCleaning(false);
        }
      },
    });
  };

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>服务人员管理</h2>
      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline">
          <Form.Item name="name" label="姓名">
            <Input placeholder="请输入姓名" allowClear />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input placeholder="请输入手机号" allowClear />
          </Form.Item>
          <Form.Item name="intakeStatus" label="入驻状态">
            <Select
              placeholder="请选择"
              allowClear
              style={{ width: 140 }}
              options={[
                { label: '草稿', value: 'draft' },
                { label: '待审核', value: 'pending_review' },
                { label: '已通过', value: 'approved' },
                { label: '已拒绝', value: 'rejected' },
                { label: '待补充', value: 'needs_more_info' },
              ]}
            />
          </Form.Item>
          <Form.Item name="listingStatus" label="上架状态">
            <Select
              placeholder="请选择"
              allowClear
              style={{ width: 140 }}
              options={[
                { label: '已上架', value: 'on' },
                { label: '已暂停', value: 'paused' },
                { label: '未上架', value: 'off' },
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
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
          <Checkbox
            checked={includeDraft}
            onChange={(e) => {
              setIncludeDraft(e.target.checked);
              setPage(1);
            }}
          >
            包含草稿
          </Checkbox>
          <Button
            danger
            icon={<DeleteOutlined />}
            loading={cleaning}
            onClick={handleCleanup}
          >
            清理7天前草稿
          </Button>
        </div>
      </Card>
      <Card>
        <StaffTable
          dataSource={data}
          loading={loading}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={handlePageChange}
        />
      </Card>
    </div>
  );
};

export default StaffList;
