import React from 'react';
import { List, Tag, Descriptions, Badge } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import type { CredentialRecord } from '../services/staff';

interface StaffCredentialListProps {
  credentials: CredentialRecord[];
}

const credentialTypeLabels: Record<string, string> = {
  id_card: '身份证',
  health_cert: '健康证',
  skill_cert: '技能证书',
  training_cert: '培训证书',
  other: '其他',
};

const statusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待审核' },
  approved: { color: 'green', text: '已通过' },
  rejected: { color: 'red', text: '已拒绝' },
  expired: { color: 'default', text: '已过期' },
};

const StaffCredentialList: React.FC<StaffCredentialListProps> = ({ credentials }) => {
  return (
    <List
      dataSource={credentials}
      renderItem={(item) => {
        const statusCfg = statusMap[item.status] || { color: 'default', text: item.status };
        return (
          <List.Item>
            <List.Item.Meta
              avatar={<FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
              title={
                <span>
                  {credentialTypeLabels[item.credentialType] || item.credentialType}
                  {item.badge === 'expiring' && (
                    <Tag color="warning" style={{ marginLeft: 8 }}>即将过期</Tag>
                  )}
                  {item.badge === 'expired' && (
                    <Tag color="error" style={{ marginLeft: 8 }}>已过期</Tag>
                  )}
                </span>
              }
              description={
                <Descriptions size="small" column={2}>
                  {item.credentialName && (
                    <Descriptions.Item label="证件名称">{item.credentialName}</Descriptions.Item>
                  )}
                  {item.credentialNumber && (
                    <Descriptions.Item label="证件编号">{item.credentialNumber}</Descriptions.Item>
                  )}
                  {item.issueDate && (
                    <Descriptions.Item label="发证日期">{item.issueDate}</Descriptions.Item>
                  )}
                  {item.expiryDate && (
                    <Descriptions.Item label="到期日期">{item.expiryDate}</Descriptions.Item>
                  )}
                  <Descriptions.Item label="审核状态">
                    <Tag color={statusCfg.color}>{statusCfg.text}</Tag>
                  </Descriptions.Item>
                  {item.remark && (
                    <Descriptions.Item label="备注" span={2}>{item.remark}</Descriptions.Item>
                  )}
                </Descriptions>
              }
            />
          </List.Item>
        );
      }}
    />
  );
};

export default StaffCredentialList;
