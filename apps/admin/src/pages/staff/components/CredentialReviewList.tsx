import React, { useState } from 'react';
import { List, Tag, Descriptions, Button, Space, Modal, Input, message, Image } from 'antd';
import { CheckOutlined, CloseOutlined, FileImageOutlined } from '@ant-design/icons';
import type { CredentialRecord } from '../services/staff';
import { approveCredential, rejectCredential } from '../services/staff';
import AuthImage from './AuthImage';

const { TextArea } = Input;

interface CredentialReviewListProps {
  staffId: string;
  intakeStatus?: string;
  credentials: CredentialRecord[];
  onActionComplete: () => void;
}

const credentialTypeLabels: Record<string, string> = {
  id_card: '居民身份证',
  health_cert: '健康证',
  no_crime_cert: '无犯罪记录证明',
  credit_report: '征信报告',
  medical_report: '体检报告',
  insurance: '保险',
  skill_cert: '技能证书',
  education: '学历/毕业证',
  student_card: '学生证',
  other: '其他',
};

const mandatoryCredentialTypes = [
  'id_card',
  'health_cert',
  'no_crime_cert',
  'credit_report',
  'medical_report',
];

function getCredentialTag(credentialType: string): { color: string; text: string } {
  if (credentialType === 'skill_cert') {
    return { color: 'blue', text: '技能证书' };
  }
  if (credentialType === 'education' || credentialType === 'student_card') {
    return { color: 'green', text: '学历材料' };
  }
  if (mandatoryCredentialTypes.includes(credentialType)) {
    return { color: 'red', text: '强准入' };
  }
  return { color: 'default', text: '可选' };
}

const statusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待审核' },
  pending_review: { color: 'orange', text: '待审核' },
  approved: { color: 'green', text: '已通过' },
  rejected: { color: 'red', text: '已拒绝' },
  expired: { color: 'default', text: '已过期' },
};

const fileTypeLabels: Record<string, string> = {
  front: '人像面',
  back: '国徽面',
  credential_image: '证件图片',
  attachment: '附件',
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

const CredentialReviewList: React.FC<CredentialReviewListProps> = ({
  staffId,
  intakeStatus,
  credentials,
  onActionComplete,
}) => {
  const [rejectModal, setRejectModal] = useState<{ open: boolean; credentialId: string | null }>({
    open: false,
    credentialId: null,
  });
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  const handleApprove = async (credentialId: string) => {
    setLoading(credentialId);
    try {
      await approveCredential(staffId, credentialId);
      message.success('证件审核通过');
      onActionComplete();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '操作失败';
      message.error(msg);
    } finally {
      setLoading(null);
    }
  };

  const handleRejectOpen = (credentialId: string) => {
    setRejectModal({ open: true, credentialId });
    setRemark('');
  };

  const handleRejectConfirm = async () => {
    if (!rejectModal.credentialId) return;
    if (!remark.trim()) {
      message.warning('请填写驳回原因');
      return;
    }
    setLoading(rejectModal.credentialId);
    try {
      await rejectCredential(staffId, rejectModal.credentialId, remark);
      message.success('证件已驳回');
      setRejectModal({ open: false, credentialId: null });
      onActionComplete();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '操作失败';
      message.error(msg);
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <List
        dataSource={credentials}
        renderItem={(item) => {
          const statusCfg = statusMap[item.status] || { color: 'default', text: item.status };
          const isPending = item.status === 'pending' || item.status === 'pending_review';
          const canReviewRejectedAfterResubmit =
            intakeStatus === 'pending_review' && item.status === 'rejected';
          const canReview = isPending || canReviewRejectedAfterResubmit;
          const credTag = getCredentialTag(item.credentialType);
          const typeLabel = item.credentialTypeLabel || credentialTypeLabels[item.credentialType] || item.credentialType;

          return (
            <List.Item
              actions={
                canReview
                  ? [
                      <Button
                        key="approve"
                        type="primary"
                        size="small"
                        icon={<CheckOutlined />}
                        loading={loading === item.id}
                        onClick={() => handleApprove(item.id)}
                      >
                        通过
                      </Button>,
                      <Button
                        key="reject"
                        danger
                        size="small"
                        icon={<CloseOutlined />}
                        loading={loading === item.id}
                        onClick={() => handleRejectOpen(item.id)}
                      >
                        驳回
                      </Button>,
                    ]
                  : undefined
              }
            >
              <List.Item.Meta
                avatar={<FileImageOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                title={
                  <span>
                    {typeLabel}
                    {item.credentialName && item.credentialName !== typeLabel && ` - ${item.credentialName}`}
                    <Tag color={statusCfg.color} style={{ marginLeft: 8 }}>
                      {statusCfg.text}
                    </Tag>
                    <Tag color={credTag.color} style={{ marginLeft: 4 }}>
                      {credTag.text}
                    </Tag>
                    {item.badge === 'expiring_soon' && (
                      <Tag color="warning" style={{ marginLeft: 4 }}>即将过期</Tag>
                    )}
                    {(item.badge === 'expired' || item.isExpired) && (
                      <Tag color="error" style={{ marginLeft: 4 }}>证件过期</Tag>
                    )}
                  </span>
                }
                description={
                  <div>
                    <Descriptions size="small" column={2}>
                      {item.credentialNumber && (
                        <Descriptions.Item label={getCredentialNumberLabel(item.credentialType)}>
                          {item.credentialNumber}
                        </Descriptions.Item>
                      )}
                      {item.credentialName && item.credentialName !== typeLabel && (
                        <Descriptions.Item label={getCredentialNameLabel(item.credentialType)}>
                          {item.credentialName}
                        </Descriptions.Item>
                      )}
                      {item.skillLevel && (
                        <Descriptions.Item label="技能等级">{item.skillLevel}</Descriptions.Item>
                      )}
                      {item.issueDate && (
                        <Descriptions.Item label={getIssueDateLabel(item.credentialType)}>{item.issueDate}</Descriptions.Item>
                      )}
                      {item.expiryDate && (
                        <Descriptions.Item label={getExpiryDateLabel(item.credentialType)}>{item.expiryDate}</Descriptions.Item>
                      )}
                      {item.issuingAuthority && (
                        <Descriptions.Item label={getIssuingAuthorityLabel(item.credentialType)}>{item.issuingAuthority}</Descriptions.Item>
                      )}
                      <Descriptions.Item label="审核状态">
                        <Tag color={statusCfg.color}>{statusCfg.text}</Tag>
                      </Descriptions.Item>
                      {item.remark && (
                        <Descriptions.Item label="备注" span={2}>{item.remark}</Descriptions.Item>
                      )}
                    </Descriptions>
                    {item.credentialType === 'skill_cert' && item.linkedSkills && item.linkedSkills.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <span style={{ color: '#666' }}>关联技能：</span>
                        <Space wrap>
                          {item.linkedSkills.map((skill) => (
                            <Tag key={skill.id} color="blue">{skill.categoryName}</Tag>
                          ))}
                        </Space>
                      </div>
                    )}
                    {item.files && item.files.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ color: '#666', marginBottom: 4, fontSize: 12 }}>证件图片：</div>
                        <Image.PreviewGroup>
                          <Space wrap align="start">
                            {item.files.map((f) => (
                              <div key={f.id} style={{ textAlign: 'center' }}>
                                <AuthImage fileId={f.fileAsset.id} alt={f.fileAsset.originalName || '证件图片'} />
                                <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                                  {f.fileSide || fileTypeLabels[f.fileType] || f.fileType || '证件图片'}
                                </div>
                              </div>
                            ))}
                          </Space>
                        </Image.PreviewGroup>
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          );
        }}
      />

      <Modal
        title="驳回证件"
        open={rejectModal.open}
        onOk={handleRejectConfirm}
        onCancel={() => setRejectModal({ open: false, credentialId: null })}
        confirmLoading={!!rejectModal.credentialId && loading === rejectModal.credentialId}
        okText="确认驳回"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <div style={{ marginTop: 16 }}>
          <TextArea
            rows={4}
            placeholder="请填写驳回原因"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />
        </div>
      </Modal>
    </>
  );
};

export default CredentialReviewList;
