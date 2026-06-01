import React, { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Button, Modal, Input, Space, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { SafetyOutlined, PlusOutlined } from '@ant-design/icons';
import { listRoles, createRole, type RoleRecord } from './services/role';
import { getUser } from '../../utils/auth';
import type { ColumnsType } from 'antd/es/table';

const RoleList: React.FC = () => {
  const navigate = useNavigate();
  const currentAdmin = getUser();
  const isSuper = currentAdmin?.isSuper ?? false;

  const [data, setData] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', code: '', description: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listRoles();
      setData(Array.isArray(result) ? result : []);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      message.warning('请输入角色名称');
      return;
    }
    if (!createForm.code.trim()) {
      message.warning('请输入角色编码');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(createForm.code.trim())) {
      message.warning('角色编码只能包含字母、数字、下划线和连字符');
      return;
    }
    setCreateSubmitting(true);
    try {
      await createRole({
        name: createForm.name.trim(),
        code: createForm.code.trim(),
        description: createForm.description.trim() || undefined,
      });
      message.success('角色创建成功');
      setCreateModalOpen(false);
      setCreateForm({ name: '', code: '', description: '' });
      fetchData();
    } catch {
      // handled by interceptor
    } finally {
      setCreateSubmitting(false);
    }
  };

  const columns: ColumnsType<RoleRecord> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '角色编码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => text || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: RoleRecord) => (
        <Button
          type="link"
          icon={<SafetyOutlined />}
          size="small"
          onClick={() => navigate(`/role/${record.id}/permissions`)}
        >
          配置权限
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <h2 style={{ margin: 0 }}>角色管理</h2>
        {isSuper && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
            新增角色
          </Button>
        )}
      </Space>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
      />
      <Modal
        title="新增角色"
        open={createModalOpen}
        onOk={handleCreate}
        onCancel={() => {
          setCreateModalOpen(false);
          setCreateForm({ name: '', code: '', description: '' });
        }}
        confirmLoading={createSubmitting}
        okText="确认创建"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>
            角色名称 <span style={{ color: 'red' }}>*</span>
          </div>
          <Input
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            placeholder="请输入角色名称"
            maxLength={64}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>
            角色编码 <span style={{ color: 'red' }}>*</span>
          </div>
          <Input
            value={createForm.code}
            onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
            placeholder="请输入角色编码（字母、数字、下划线、连字符）"
            maxLength={64}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>描述</div>
          <Input.TextArea
            value={createForm.description}
            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
            placeholder="请输入角色描述"
            rows={3}
            maxLength={255}
          />
        </div>
      </Modal>
    </div>
  );
};

export default RoleList;
