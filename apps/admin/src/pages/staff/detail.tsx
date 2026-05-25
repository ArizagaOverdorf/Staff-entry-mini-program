import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Spin, Button, Space, Tabs } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import StaffProfileCard from './components/StaffProfileCard';
import StaffCredentialList from './components/StaffCredentialList';
import {
  getStaffDetail,
  getStaffCredentials,
  type StaffRecord,
  type CredentialRecord,
} from './services/staff';

const StaffDetail: React.FC = () => {
  const { staffId } = useParams<{ staffId: string }>();
  const navigate = useNavigate();

  const [staff, setStaff] = useState<StaffRecord | null>(null);
  const [credentials, setCredentials] = useState<CredentialRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!staffId) return;
    setLoading(true);
    try {
      const [staffData, credentialsData] = await Promise.all([
        getStaffDetail(staffId),
        getStaffCredentials(staffId),
      ]);
      setStaff(staffData);
      setCredentials(Array.isArray(credentialsData) ? credentialsData : []);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
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
      <Tabs defaultActiveKey="profile">
        <Tabs.TabPane tab="基本信息" key="profile">
          <StaffProfileCard staff={staff} />
        </Tabs.TabPane>
        <Tabs.TabPane tab="证件信息" key="credentials">
          <Card title="证件列表">
            {credentials.length > 0 ? (
              <StaffCredentialList credentials={credentials} />
            ) : (
              <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                暂无证件信息
              </div>
            )}
          </Card>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default StaffDetail;
