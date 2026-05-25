import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import BasicLayout from './layouts/BasicLayout';
import LoginPage from './pages/login';
import Dashboard from './pages/dashboard';
import AdminUser from './pages/admin-user';
import RoleList from './pages/role';
import PermissionConfig from './pages/role/permission-config';
import DictManagement from './pages/dict';
import StaffList from './pages/staff';
import StaffDetail from './pages/staff/detail';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<BasicLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="admin-user" element={<AdminUser />} />
        <Route path="role" element={<RoleList />} />
        <Route path="role/:roleId/permissions" element={<PermissionConfig />} />
        <Route path="dict" element={<DictManagement />} />
        <Route path="staff" element={<StaffList />} />
        <Route path="staff/:staffId" element={<StaffDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
