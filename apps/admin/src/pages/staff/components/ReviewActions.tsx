import React, { useState } from 'react';
import { Button, Modal, Input, Space, message } from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  approveIntake,
  rejectIntake,
  requestMoreInfo,
} from '../services/staff';

const { TextArea } = Input;

interface ReviewActionsProps {
  staffId: string;
  intakeStatus: string;
  onActionComplete: () => void;
}

const actionLabels: Record<string, string> = {
  pending_review: '审核中',
  approved: '已通过',
  rejected: '已驳回',
  needs_more_info: '待补充',
};

const ReviewActions: React.FC<ReviewActionsProps> = ({
  staffId,
  intakeStatus,
  onActionComplete,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'need_more_info' | null>(null);
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);

  const canReview = intakeStatus === 'pending_review';

  const handleAction = (type: 'approve' | 'reject' | 'need_more_info') => {
    setActionType(type);
    setRemark('');
    setModalOpen(true);
  };

  const handleConfirm = async () => {
    if (actionType === 'reject' && !remark.trim()) {
      message.warning('驳回时请填写原因');
      return;
    }
    if (actionType === 'need_more_info' && !remark.trim()) {
      message.warning('请填写需要补充的内容');
      return;
    }

    setLoading(true);
    try {
      if (actionType === 'approve') {
        await approveIntake(staffId, remark || undefined);
        message.success('审核通过');
      } else if (actionType === 'reject') {
        await rejectIntake(staffId, remark);
        message.success('已驳回');
      } else if (actionType === 'need_more_info') {
        await requestMoreInfo(staffId, remark);
        message.success('已要求补充资料');
      }
      setModalOpen(false);
      onActionComplete();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '操作失败';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const modalTitle =
    actionType === 'approve'
      ? '审核通过'
      : actionType === 'reject'
        ? '驳回申请'
        : '要求补充资料';

  const modalPlaceholder =
    actionType === 'approve'
      ? '审核备注（可选）'
      : actionType === 'reject'
        ? '请填写驳回原因'
        : '请填写需要补充的内容';

  return (
    <>
      {canReview ? (
        <Space>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => handleAction('approve')}
          >
            审核通过
          </Button>
          <Button
            danger
            icon={<CloseOutlined />}
            onClick={() => handleAction('reject')}
          >
            驳回
          </Button>
          <Button
            icon={<ExclamationCircleOutlined />}
            onClick={() => handleAction('need_more_info')}
          >
            要求补充
          </Button>
        </Space>
      ) : (
        <span style={{ color: '#999' }}>
          当前状态 ({actionLabels[intakeStatus] || intakeStatus}) 不支持审核操作
        </span>
      )}

      <Modal
        title={modalTitle}
        open={modalOpen}
        onOk={handleConfirm}
        onCancel={() => setModalOpen(false)}
        confirmLoading={loading}
        okText="确认"
        cancelText="取消"
        okButtonProps={{
          danger: actionType === 'reject',
        }}
      >
        <div style={{ marginTop: 16 }}>
          <TextArea
            rows={4}
            placeholder={modalPlaceholder}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />
        </div>
      </Modal>
    </>
  );
};

export default ReviewActions;
