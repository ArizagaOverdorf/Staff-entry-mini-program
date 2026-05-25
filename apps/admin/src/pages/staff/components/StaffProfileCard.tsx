import React from 'react';
import { Card, Descriptions, Tag, Badge } from 'antd';
import type { StaffRecord } from '../services/staff';

interface StaffProfileCardProps {
  staff: StaffRecord;
}

const StaffProfileCard: React.FC<StaffProfileCardProps> = ({ staff }) => {
  const maskPhone = (phone?: string) => {
    if (!phone) return '-';
    return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
  };

  const maskIdNumber = (idNumber?: string) => {
    if (!idNumber) return '-';
    if (idNumber.length >= 10) {
      return `${idNumber.slice(0, 3)}********${idNumber.slice(-4)}`;
    }
    return '****';
  };

  const intakeStatusMap: Record<string, { color: string; text: string }> = {
    draft: { color: 'default', text: '草稿' },
    pending_review: { color: 'orange', text: '待审核' },
    approved: { color: 'green', text: '已通过' },
    rejected: { color: 'red', text: '已拒绝' },
    needs_more_info: { color: 'purple', text: '待补充' },
  };

  const listingStatusMap: Record<string, { color: string; text: string }> = {
    on: { color: 'green', text: '已上架' },
    paused: { color: 'orange', text: '已暂停' },
    off: { color: 'default', text: '未上架' },
    offline: { color: 'default', text: '未上架' },
  };

  return (
    <Card title="基本信息">
      <Descriptions column={2} bordered size="small">
        <Descriptions.Item label="编号">{staff.staffId || '-'}</Descriptions.Item>
        <Descriptions.Item label="姓名">{staff.name || '-'}</Descriptions.Item>
        <Descriptions.Item label="手机号">
          <span title={staff.phone}>{maskPhone(staff.phone)}</span>
        </Descriptions.Item>
        <Descriptions.Item label="性别">{staff.gender || '-'}</Descriptions.Item>
        <Descriptions.Item label="年龄">{staff.age ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="身份证号">
          <span title={staff.idNumber}>{maskIdNumber(staff.idNumber)}</span>
        </Descriptions.Item>
        <Descriptions.Item label="入驻状态">
          {(() => {
            const config = intakeStatusMap[staff.intakeStatus] || { color: 'default', text: staff.intakeStatus };
            return <Tag color={config.color}>{config.text}</Tag>;
          })()}
        </Descriptions.Item>
        <Descriptions.Item label="上架状态">
          {(() => {
            const config = listingStatusMap[staff.listingStatus] || { color: 'default', text: staff.listingStatus };
            return (
              <span>
                <Badge status={staff.isAvailable ? 'success' : 'default'} />
                <span style={{ marginLeft: 4 }}>{config.text}</span>
              </span>
            );
          })()}
        </Descriptions.Item>
        <Descriptions.Item label="地址" span={2}>{staff.address || '-'}</Descriptions.Item>
        <Descriptions.Item label="紧急联系人">{staff.emergencyContact || '-'}</Descriptions.Item>
        <Descriptions.Item label="紧急电话">{staff.emergencyPhone ? maskPhone(staff.emergencyPhone) : '-'}</Descriptions.Item>
        <Descriptions.Item label="服务类别" span={2}>
          {staff.serviceCategories && staff.serviceCategories.length > 0
            ? staff.serviceCategories.join(', ')
            : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="服务区域" span={2}>
          {staff.serviceAreas && staff.serviceAreas.length > 0
            ? staff.serviceAreas.join(', ')
            : '-'}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default StaffProfileCard;
