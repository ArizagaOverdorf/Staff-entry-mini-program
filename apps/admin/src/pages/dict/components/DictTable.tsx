import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Tag, Modal, Form, Input, InputNumber, Switch, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import {
  listDictItems,
  createDictItem,
  updateDictItem,
  type DictItem,
} from '../services/dict';
import type { ColumnsType } from 'antd/es/table';

interface DictTableProps {
  groupCode: string;
}

const DictTable: React.FC<DictTableProps> = ({ groupCode }) => {
  const [data, setData] = useState<DictItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DictItem | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listDictItems(groupCode);
      setData(Array.isArray(result) ? result : []);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [groupCode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ sortOrder: 0, isActive: true });
    setModalOpen(true);
  };

  const handleEdit = (record: DictItem) => {
    setEditingRecord(record);
    form.setFieldsValue({
      dictKey: record.dictKey,
      dictValue: record.dictValue,
      sortOrder: record.sortOrder,
      isActive: record.isActive,
      remark: record.remark,
    });
    setModalOpen(true);
  };

  const handleOk = async () => {
    setConfirmLoading(true);
    try {
      const rawValues = await form.validateFields();
      if (editingRecord) {
        await updateDictItem({
          id: editingRecord.id,
          dictValue: rawValues.dictValue,
          sortOrder: rawValues.sortOrder,
          isActive: rawValues.isActive,
          remark: rawValues.remark,
        });
        message.success('更新成功');
      } else {
        await createDictItem({
          dictGroup: groupCode,
          dictKey: rawValues.dictKey,
          dictValue: rawValues.dictValue,
          sortOrder: rawValues.sortOrder,
          remark: rawValues.remark,
        });
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
      title: '键',
      dataIndex: 'dictKey',
      key: 'dictKey',
    },
    {
      title: '值',
      dataIndex: 'dictValue',
      key: 'dictValue',
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (v: boolean) =>
        v ? <Tag color="green">启用</Tag> : <Tag color="red">禁用</Tag>,
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
          <Form.Item
            name="dictKey"
            label="键"
            rules={[{ required: true, message: '请输入字典键' }]}
          >
            <Input placeholder="例如：pending" disabled={!!editingRecord} />
          </Form.Item>
          <Form.Item
            name="dictValue"
            label="值"
            rules={[{ required: true, message: '请输入字典值' }]}
          >
            <Input placeholder="例如：待审核" />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="isActive" label="状态" valuePropName="checked">
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
