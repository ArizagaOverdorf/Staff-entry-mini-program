import React from 'react';
import { Table, Tag, Badge, Space, Tooltip, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { StaffRecord } from '../services/staff';
import type { ColumnsType } from 'antd/es/table';

interface StaffTableProps {
  dataSource: StaffRecord[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
}

const intakeStatusMap: Record<string, { color: string; text: string }> = {
  draft: { color: 'default', text: '草稿' },
  pending: { color: 'orange', text: '待审核' },
  approved: { color: 'green', text: '已通过' },
  rejected: { color: 'red', text: '已拒绝' },
  info_required: { color: 'purple', text: '待补充' },
};

const listingStatusMap: Record<string, { color: string; text: string }> = {
  listed: { color: 'green', text: '已上架' },
  paused: { color: 'orange', text: '已暂停' },
  unlisted: { color: 'default', text: '未上架' },
};

const StaffTable: React.FC<StaffTableProps> = ({
  dataSource,
  loading,
  total,
  page,
  pageSize,
  onPageChange,
}) => {
  const navigate = useNavigate();

  const columns: ColumnsType<StaffRecord> = [
    {
      title: '编号',
      dataIndex: 'staffId',
      key: 'staffId',
      width: 160,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      render: (text: string) => (
        <Tooltip title="点击查看详情可查看完整手机号">
          <span>{text ? `${text.slice(0, 3)}****${text.slice(-4)}` : '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '入驻状态',
      dataIndex: 'intakeStatus',
      key: 'intakeStatus',
      render: (status: string) => {
        const config = intakeStatusMap[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '上架状态',
      dataIndex: 'listingStatus',
      key: 'listingStatus',
      render: (status: string, record: StaffRecord) => {
        const config = listingStatusMap[status] || { color: 'default', text: status };
        return (
          <Space>
            <Badge status={record.isAvailable ? 'success' : 'default'} />
            <span>{config.text}</span>
          </Space>
        );
      },
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
      width: 120,
      render: (_: unknown, record: StaffRecord) => (
        <Button type="link" size="small" onClick={() => navigate(`/staff/${record.staffId}`)}>
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      rowKey="id"
      loading={loading}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        showTotal: (t) => `共 ${t} 条`,
        onChange: onPageChange,
      }}
    />
  );
};

export default StaffTable;
