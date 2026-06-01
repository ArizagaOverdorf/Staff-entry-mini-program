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
  no_crime_cert: '无犯罪记录证明',
  credit_report: '征信报告',
  medical_report: '体检报告',
  insurance: '保险',
  skill_cert: '技能证书',
  education: '学历',
  other: '其他',
};

const statusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待审核' },
  approved: { color: 'green', text: '已通过' },
  rejected: { color: 'red', text: '已拒绝' },
  expired: { color: 'default', text: '已过期' },
};

function getCredentialNameLabel(credentialType: string): string {
  if (credentialType === 'education') return '学历';
  if (credentialType === 'student_card') return '学历水平';
  return '证件名称';
}

function getCredentialNumberLabel(credentialType: string): string {
  if (credentialType === 'id_card') return '身份证号';
  if (credentialType === 'insurance') return '保险单号';
  return '证件编号';
}

function getIssueDateLabel(credentialType: string): string {
  return credentialType === 'insurance' ? '生效日期' : '签发日期';
}

function getExpiryDateLabel(credentialType: string): string {
  return credentialType === 'insurance' ? '有效日期' : '到期日期';
}

function getIssuingAuthorityLabel(credentialType: string): string {
  if (credentialType === 'insurance') return '保险公司';
  if (credentialType === 'education' || credentialType === 'student_card') return '专业';
  return '签发机构';
}

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
                  {(item.badge === 'expiring_soon' || item.badge === 'expiring') && (
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
                    <Descriptions.Item label={getCredentialNameLabel(item.credentialType)}>{item.credentialName}</Descriptions.Item>
                  )}
                  {item.credentialNumber && (
                    <Descriptions.Item label={getCredentialNumberLabel(item.credentialType)}>{item.credentialNumber}</Descriptions.Item>
                  )}
                  {item.issueDate && (
                    <Descriptions.Item label={getIssueDateLabel(item.credentialType)}>{item.issueDate}</Descriptions.Item>
                  )}
                  {item.expiryDate && (
                    <Descriptions.Item label={getExpiryDateLabel(item.credentialType)}>{item.expiryDate}</Descriptions.Item>
                  )}
                  {item.issuingAuthority && (
                    <Descriptions.Item label={getIssuingAuthorityLabel(item.credentialType)}>
                      {item.issuingAuthority}
                    </Descriptions.Item>
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
