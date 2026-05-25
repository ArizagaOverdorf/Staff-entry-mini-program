import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, Tag, message, Popconfirm } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import AdminUserForm from './components/AdminUserForm';
import {
  listAdminUsers,
  createAdminUser,
  updateAdminUser,
  type AdminUserRecord,
  type CreateAdminUserParams,
} from './services/admin-user';
import type { ColumnsType } from 'antd/es/table';

const AdminUser: React.FC = () => {
  const [data, setData] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AdminUserRecord | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listAdminUsers();
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

  const handleAdd = () => {
    setEditingRecord(null);
    setModalOpen(true);
  };

  const handleEdit = (record: AdminUserRecord) => {
    setEditingRecord(record);
    setModalOpen(true);
  };

  const handleModalOk = async (values: CreateAdminUserParams) => {
    setConfirmLoading(true);
    try {
      if (editingRecord) {
        await updateAdminUser({ id: editingRecord.id, ...values });
        message.success('更新成功');
      } else {
        await createAdminUser(values);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchData();
    } catch {
      // handled by interceptor
    } finally {
      setConfirmLoading(false);
    }
  };

  const columns: ColumnsType<AdminUserRecord> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '真实姓名',
      dataIndex: 'realName',
      key: 'realName',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '角色',
      dataIndex: 'roleName',
      key: 'roleName',
      render: (text: string) => (text ? <Tag color="blue">{text}</Tag> : '-'),
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
      render: (_: unknown, record: AdminUserRecord) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>管理员管理</h2>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增管理员
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
      />
      <AdminUserForm
        open={modalOpen}
        editingRecord={editingRecord}
        onCancel={() => setModalOpen(false)}
        onOk={handleModalOk}
        confirmLoading={confirmLoading}
      />
    </div>
  );
};

export default AdminUser;
