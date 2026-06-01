import React, { useState, useEffect } from 'react';
import { List, Tag, Descriptions, Button, Space, Modal, Input, message, Image } from 'antd';
import { CheckOutlined, CloseOutlined, FileImageOutlined } from '@ant-design/icons';
import type { CredentialRecord } from '../services/staff';
import { approveCredential, rejectCredential } from '../services/staff';
import { getToken } from '../../../utils/auth';

const { TextArea } = Input;

interface CredentialReviewListProps {
  staffId: string;
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

const AuthImage: React.FC<{ fileId: string; alt: string }> = ({ fileId, alt }) => {
  const [src, setSrc] = useState<string>('');
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';
    const token = getToken();
    fetch(`/api/admin/files/${fileId}/preview`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('fetch failed');
        return r.blob();
      })
      .then((blob) => {
        if (!cancelled) {
          objectUrl = URL.createObjectURL(blob);
          setSrc(objectUrl);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileId]);

  if (error) return <span style={{ color: '#999', fontSize: 12 }}>加载失败</span>;
  if (!src) return <span style={{ color: '#999', fontSize: 12 }}>加载中...</span>;
  return (
    <Image
      src={src}
      alt={alt}
      width={240}
      height="auto"
      style={{ maxHeight: 360, objectFit: 'contain' }}
      fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQwIiBoZWlnaHQ9IjE2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiIGZvbnQtc2l6ZT0iMTQiPuWbvueJh+WKoOi9veWksei0pTwvdGV4dD48L3N2Zz4="
    />
  );
};

const CredentialReviewList: React.FC<CredentialReviewListProps> = ({
  staffId,
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
          const isPending = item.status === 'pending';
          const credTag = getCredentialTag(item.credentialType);
          const typeLabel = item.credentialTypeLabel || credentialTypeLabels[item.credentialType] || item.credentialType;

          return (
            <List.Item
              actions={
                isPending
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
                        <Descriptions.Item label={item.credentialType === 'id_card' ? '身份证号' : '证件编号'}>
                          {item.credentialNumber}
                        </Descriptions.Item>
                      )}
                      {item.skillLevel && (
                        <Descriptions.Item label="技能等级">{item.skillLevel}</Descriptions.Item>
                      )}
                      {item.issueDate && (
                        <Descriptions.Item label="发证日期">{item.issueDate}</Descriptions.Item>
                      )}
                      {item.expiryDate && (
                        <Descriptions.Item label="到期日期">{item.expiryDate}</Descriptions.Item>
                      )}
                      {item.issuingAuthority && (
                        <Descriptions.Item label="签发机构">{item.issuingAuthority}</Descriptions.Item>
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
