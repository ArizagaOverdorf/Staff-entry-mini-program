import React, { useEffect } from 'react';
import { Modal, Form, Input } from 'antd';
import type { AdminUserRecord, CreateAdminUserParams } from '../services/admin-user';

interface AdminUserFormProps {
  open: boolean;
  editingRecord: AdminUserRecord | null;
  onCancel: () => void;
  onOk: (values: CreateAdminUserParams) => void;
  confirmLoading: boolean;
}

const AdminUserForm: React.FC<AdminUserFormProps> = ({
  open,
  editingRecord,
  onCancel,
  onOk,
  confirmLoading,
}) => {
  const [form] = Form.useForm();
  const isEdit = !!editingRecord;

  useEffect(() => {
    if (open) {
      if (editingRecord) {
        form.setFieldsValue({
          username: editingRecord.username,
          realName: editingRecord.realName,
          phone: editingRecord.phone,
          password: '',
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, editingRecord, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onOk(values);
    } catch {
      // validation failed
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑管理员' : '新增管理员'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      destroyOnClose
    >
      <Form form={form} layout="vertical" autoComplete="off">
        <Form.Item
          name="username"
          label="用户名"
          rules={[
            { required: true, message: '请输入用户名' },
            { min: 2, message: '用户名至少2个字符' },
          ]}
        >
          <Input disabled={isEdit} placeholder="请输入用户名" />
        </Form.Item>
        <Form.Item
          name="realName"
          label="真实姓名"
          rules={[{ required: true, message: '请输入真实姓名' }]}
        >
          <Input placeholder="请输入真实姓名" />
        </Form.Item>
        <Form.Item
          name="phone"
          label="手机号"
          rules={[
            { required: true, message: '请输入手机号' },
            { pattern: /^1\d{10}$/, message: '请输入正确的手机号' },
          ]}
        >
          <Input placeholder="请输入手机号" />
        </Form.Item>
        <Form.Item
          name="password"
          label={isEdit ? '密码（留空不修改）' : '密码'}
          rules={
            isEdit
              ? []
              : [
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6个字符' },
                ]
          }
        >
          <Input.Password placeholder="请输入密码" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AdminUserForm;
