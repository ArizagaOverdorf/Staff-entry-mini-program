import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Input, InputNumber, Switch, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import {
  listDictItems,
  createDictItem,
  updateDictItem,
  type DictItem,
  type DictGroup,
} from '../services/dict';
import type { ColumnsType } from 'antd/es/table';

interface DictTableProps {
  group: DictGroup;
}

const DictTable: React.FC<DictTableProps> = ({ group }) => {
  const [data, setData] = useState<DictItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DictItem | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listDictItems(group.id);
      setData(Array.isArray(result) ? result : []);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [group.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ groupId: group.id, sort: 0, status: true });
    setModalOpen(true);
  };

  const handleEdit = (record: DictItem) => {
    setEditingRecord(record);
    form.setFieldsValue({ ...record, status: record.status === 1 });
    setModalOpen(true);
  };

  const handleOk = async () => {
    setConfirmLoading(true);
    try {
      const rawValues = await form.validateFields();
      const values = {
        ...rawValues,
        status: rawValues.status ? 1 : 0,
      };
      if (editingRecord) {
        await updateDictItem({ id: editingRecord.id, ...values });
        message.success('更新成功');
      } else {
        await createDictItem(values);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchData();
    } catch {
      // validation or API error
    } finally {
      setConfirmLoading(false);
    }
  };

  const columns: ColumnsType<DictItem> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '标签',
      dataIndex: 'label',
      key: 'label',
    },
    {
      title: '值',
      dataIndex: 'value',
      key: 'value',
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: number) =>
        status === 1 ? <Tag color="green">启用</Tag> : <Tag color="red">禁用</Tag>,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      render: (text: string) => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: DictItem) => (
        <Button type="link" size="small" onClick={() => handleEdit(record)}>
          编辑
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAdd}>
          新增字典项
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={false}
      />
      <Modal
        title={editingRecord ? '编辑字典项' : '新增字典项'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        confirmLoading={confirmLoading}
        destroyOnClose
      >
        <Form form={form} layout="vertical" autoComplete="off">
          <Form.Item name="groupId" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="label" label="标签" rules={[{ required: true, message: '请输入标签' }]}>
            <Input placeholder="例如：待审核" />
          </Form.Item>
          <Form.Item name="value" label="值" rules={[{ required: true, message: '请输入值' }]}>
            <Input placeholder="例如：pending" />
          </Form.Item>
          <Form.Item name="sort" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="可选备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DictTable;
