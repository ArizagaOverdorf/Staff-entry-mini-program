import React from 'react';
import { Layout, Button, Space, Dropdown } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getUser, clearAuth } from '../../utils/auth';
import type { MenuProps } from 'antd';

const { Header } = Layout;

const HeaderBar: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getUser();

  const handleLogout = () => {
    clearAuth();
    navigate('/login', { replace: true });
  };

  const dropdownItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Header
      style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <Space>
        <Dropdown menu={{ items: dropdownItems }} placement="bottomRight">
          <Button type="text" icon={<UserOutlined />}>
            {currentUser?.realName || currentUser?.username || '管理员'}
          </Button>
        </Dropdown>
      </Space>
    </Header>
  );
};

export default HeaderBar;
