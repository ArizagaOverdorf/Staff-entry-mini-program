import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
  SafetyOutlined,
  BookOutlined,
  FileTextOutlined,
  MessageOutlined,
} from '@ant-design/icons';

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '工作台',
  },
  {
    key: '/staff',
    icon: <TeamOutlined />,
    label: '服务人员',
  },
  {
    key: '/service-record',
    icon: <FileTextOutlined />,
    label: '服务记录',
  },
  {
    key: '/support',
    icon: <MessageOutlined />,
    label: '客服消息',
  },
  {
    key: '/admin-user',
    icon: <UserOutlined />,
    label: '管理员',
  },
  {
    key: '/role',
    icon: <SafetyOutlined />,
    label: '角色权限',
  },
  {
    key: '/dict',
    icon: <BookOutlined />,
    label: '字典',
  },
];

const SideMenu: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey = '/' + location.pathname.split('/')[1];

  const handleClick = (info: { key: string }) => {
    navigate(info.key);
  };

  return (
    <Menu
      mode="inline"
      selectedKeys={[selectedKey]}
      items={menuItems}
      onClick={handleClick}
      style={{ height: '100%', borderRight: 0 }}
    />
  );
};

export default SideMenu;
