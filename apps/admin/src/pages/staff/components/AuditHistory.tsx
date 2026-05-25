import React from 'react';
import { Timeline, Tag } from 'antd';
import { AuditRecordItem } from '../services/staff';

interface AuditHistoryProps {
  records: AuditRecordItem[];
}

const actionLabels: Record<string, { label: string; color: string }> = {
  intake_approve: { label: '审核通过', color: 'green' },
  intake_reject: { label: '审核驳回', color: 'red' },
  intake_request_more_info: { label: '要求补充', color: 'orange' },
  credential_approve: { label: '证件通过', color: 'green' },
  credential_reject: { label: '证件驳回', color: 'red' },
  submit: { label: '提交审核', color: 'blue' },
};

const AuditHistory: React.FC<AuditHistoryProps> = ({ records }) => {
  if (records.length === 0) {
    return <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>暂无审核记录</div>;
  }

  return (
    <Timeline
      items={records.map((r) => {
        const cfg = actionLabels[r.action] || { label: r.action, color: 'default' };
        return {
          color: cfg.color,
          children: (
            <div>
              <Tag color={cfg.color}>{cfg.label}</Tag>
              {r.adminUser && (
                <span style={{ marginLeft: 8, color: '#666' }}>
                  操作人: {r.adminUser.name}
                </span>
              )}
              {r.remark && (
                <div style={{ marginTop: 4, color: '#333' }}>{r.remark}</div>
              )}
              {r.createdAt && (
                <div style={{ fontSize: 12, color: '#999' }}>
                  {new Date(r.createdAt).toLocaleString('zh-CN')}
                </div>
              )}
            </div>
          ),
        };
      })}
    />
  );
};

export default AuditHistory;
