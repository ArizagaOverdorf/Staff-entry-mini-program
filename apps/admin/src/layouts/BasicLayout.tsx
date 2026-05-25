import React from 'react';
import { Layout } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import SideMenu from './components/SideMenu';
import HeaderBar from './components/HeaderBar';
import { isAuthenticated } from '../utils/auth';
import { useEffect } from 'react';

const { Sider, Content } = Layout;

const BasicLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true });
    }
  }, [navigate, location.pathname]);

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: 18,
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          家政服务后台
        </div>
        <SideMenu />
      </Sider>
      <Layout>
        <HeaderBar />
        <Content style={{ margin: 24, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default BasicLayout;
