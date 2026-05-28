import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Spin, Button, Space, Tabs, Empty } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import StaffProfileCard from './components/StaffProfileCard';
import CredentialReviewList from './components/CredentialReviewList';
import ReviewActions from './components/ReviewActions';
import AuditHistory from './components/AuditHistory';
import {
  getStaffDetail,
  getStaffCredentials,
  getStaffAuditRecords,
  type StaffRecord,
  type CredentialRecord,
  type AuditRecordItem,
} from './services/staff';

const VALID_TABS = ['profile', 'review', 'credentials'];

const StaffDetail: React.FC = () => {
  const { staffId } = useParams<{ staffId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = VALID_TABS.includes(searchParams.get('tab') ?? '') ? searchParams.get('tab')! : 'profile';

  const [staff, setStaff] = useState<StaffRecord | null>(null);
  const [credentials, setCredentials] = useState<CredentialRecord[]>([]);
  const [auditRecords, setAuditRecords] = useState<AuditRecordItem[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);

  const fetchData = useCallback(async (isInitial: boolean) => {
    if (!staffId) return;
    if (isInitial) {
      setInitialLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const [staffData, credentialsData, auditData] = await Promise.all([
        getStaffDetail(staffId),
        getStaffCredentials(staffId),
        getStaffAuditRecords(staffId),
      ]);
      setStaff(staffData);
      setCredentials(Array.isArray(credentialsData) ? credentialsData : []);
      setAuditRecords(Array.isArray(auditData) ? auditData : []);
    } catch {
      // handled by interceptor
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [staffId]);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData(false);
  }, [fetchData]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setSearchParams({ tab: key }, { replace: true });
  };

  if (initialLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!staff) {
    return (
      <div>
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/staff')}
          style={{ padding: 0 }}
        >
          返回列表
        </Button>
        <Card style={{ marginTop: 16, textAlign: 'center', padding: 40 }}>
          未找到服务人员信息
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/staff')}
          style={{ padding: 0 }}
        >
          返回列表
        </Button>
      </Space>
      <Spin spinning={refreshing}>
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <Tabs.TabPane tab="基本信息" key="profile">
            <StaffProfileCard staff={staff} onRefresh={refresh} />
          </Tabs.TabPane>
          <Tabs.TabPane tab="审核" key="review">
            <Card title="入驻审核" style={{ marginBottom: 16 }}>
              <ReviewActions
                staffId={staff.staffId}
                intakeStatus={staff.intakeStatus}
                onActionComplete={refresh}
              />
            </Card>
            <Card title={`证件审核 (${credentials.length})`} style={{ marginBottom: 16 }}>
              {credentials.length > 0 ? (
                <CredentialReviewList
                  staffId={staff.staffId}
                  credentials={credentials}
                  onActionComplete={refresh}
                />
              ) : (
                <Empty description="暂无证件" />
              )}
            </Card>
            <Card title="审核记录">
              <AuditHistory records={auditRecords} />
            </Card>
          </Tabs.TabPane>
          <Tabs.TabPane tab="证件信息" key="credentials">
            <Card title="证件列表">
              {credentials.length > 0 ? (
                <CredentialReviewList
                  staffId={staff.staffId}
                  credentials={credentials}
                  onActionComplete={refresh}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                  暂无证件信息
                </div>
              )}
            </Card>
          </Tabs.TabPane>
        </Tabs>
      </Spin>
    </div>
  );
};

export default StaffDetail;
