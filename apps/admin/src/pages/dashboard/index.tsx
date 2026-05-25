import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Spin } from 'antd';
import {
  TeamOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { getDashboardStats } from '../staff/services/staff';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<{
    totalStaff: number;
    pendingReview: number;
    approved: number;
    todaySubmitted: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const s = stats || { totalStaff: 0, pendingReview: 0, approved: 0, todaySubmitted: 0 };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>工作台</h2>
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="服务人员总数"
                value={s.totalStaff}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="待审核入驻"
                value={s.pendingReview}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="已通过审核"
                value={s.approved}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="今日提交"
                value={s.todaySubmitted}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
      <Card style={{ marginTop: 24 }}>
        <p style={{ color: '#666', fontSize: 14 }}>
          欢迎使用家政服务人员入驻后台管理系统。请使用左侧菜单导航。
        </p>
      </Card>
    </div>
  );
};

export default Dashboard;
