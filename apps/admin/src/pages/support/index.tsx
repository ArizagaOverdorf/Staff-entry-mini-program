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
  Tag,
  message,
} from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  listSupportMessages,
  replySupportMessage,
  type SupportMessageItem,
} from './services/support';

const { TextArea } = Input;

const messageTypeLabels: Record<string, string> = {
  support_request: '员工咨询',
  support_reply: '客服回复',
};

const SupportPage: React.FC = () => {
  const [data, setData] = useState<SupportMessageItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form] = Form.useForm();
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<SupportMessageItem | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const params: any = {
        page,
        pageSize,
        keyword: values.keyword || undefined,
        messageType: values.messageType || undefined,
        isRead: values.isRead !== undefined ? values.isRead : undefined,
      };
      const result = await listSupportMessages(params);
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

  const openReplyModal = (record: SupportMessageItem) => {
    setReplyTarget(record);
    setReplyContent('');
    setReplyModalOpen(true);
  };

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) {
      message.warning('请输入回复内容');
      return;
    }
    if (!replyTarget) return;
    setReplyLoading(true);
    try {
      await replySupportMessage(replyTarget.id, replyContent.trim());
      message.success('回复成功');
      setReplyModalOpen(false);
      fetchData();
    } catch {
      // handled by interceptor
    } finally {
      setReplyLoading(false);
    }
  };

  const columns: ColumnsType<SupportMessageItem> = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v: string) => (v ? dayjs(v).format('YYYY/MM/DD HH:mm:ss') : '-'),
    },
    {
      title: '员工ID',
      dataIndex: 'staffId',
      key: 'staffId',
      width: 100,
      render: (v: string) => v || '-',
    },
    {
      title: '员工姓名',
      dataIndex: 'staffName',
      key: 'staffName',
      width: 100,
      render: (v: string) => v || '-',
    },
    {
      title: '手机号',
      dataIndex: 'staffPhone',
      key: 'staffPhone',
      width: 130,
      render: (v: string) => v || '-',
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 180,
      ellipsis: true,
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      width: 200,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '消息类型',
      dataIndex: 'messageType',
      key: 'messageType',
      width: 100,
      render: (v: string) => {
        const label = messageTypeLabels[v] || v;
        const color = v === 'support_request' ? 'blue' : 'green';
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: '阅读状态',
      dataIndex: 'isRead',
      key: 'isRead',
      width: 90,
      render: (v: boolean) =>
        v ? <Tag color="default">已读</Tag> : <Tag color="orange">未读</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_: any, record: SupportMessageItem) => (
        <Space>
          <Button type="link" size="small" onClick={() => openReplyModal(record)}>
            回复
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>客服消息</h2>
      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline">
          <Form.Item name="keyword" label="搜索">
            <Input placeholder="员工姓名/staffId/手机号" allowClear style={{ width: 220 }} />
          </Form.Item>
          <Form.Item name="messageType" label="消息类型">
            <Select
              placeholder="全部"
              allowClear
              style={{ width: 130 }}
              options={[
                { label: '员工咨询', value: 'support_request' },
                { label: '客服回复', value: 'support_reply' },
              ]}
            />
          </Form.Item>
          <Form.Item name="isRead" label="阅读状态">
            <Select
              placeholder="全部"
              allowClear
              style={{ width: 100 }}
              options={[
                { label: '未读', value: false },
                { label: '已读', value: true },
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
      <Card title="支持消息列表">
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
        title="回复消息"
        open={replyModalOpen}
        onOk={handleReplySubmit}
        onCancel={() => setReplyModalOpen(false)}
        confirmLoading={replyLoading}
        destroyOnClose
      >
        {replyTarget && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <strong>员工：</strong>
              {replyTarget.staffName || '-'} ({replyTarget.staffId || '-'})
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>原始消息：</strong>
              {replyTarget.title}
            </div>
            <div style={{ color: '#666', whiteSpace: 'pre-wrap' }}>
              {replyTarget.content}
            </div>
          </div>
        )}
        <div style={{ marginTop: 16 }}>
          <strong>回复内容：</strong>
          <TextArea
            rows={4}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="请输入回复内容"
            maxLength={1000}
            style={{ marginTop: 8 }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default SupportPage;
