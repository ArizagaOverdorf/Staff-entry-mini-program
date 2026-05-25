import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Spin, message } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import PermissionTree from './components/PermissionTree';
import {
  getRoleDetail,
  getPermissionTree,
  getRolePermissions,
  assignPermissions,
  type PermissionNode,
} from './services/role';

const PermissionConfig: React.FC = () => {
  const { roleId } = useParams<{ roleId: string }>();
  const navigate = useNavigate();

  const [roleName, setRoleName] = useState('');
  const [treeData, setTreeData] = useState<PermissionNode[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!roleId) return;
    setLoading(true);
    try {
      const [roleDetail, permissionTree, rolePerms] = await Promise.all([
        getRoleDetail(roleId),
        getPermissionTree(),
        getRolePermissions(roleId),
      ]);
      setRoleName(roleDetail.name);
      setTreeData(Array.isArray(permissionTree) ? permissionTree : []);
      setCheckedKeys(rolePerms.permissionIds || []);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [roleId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    if (!roleId) return;
    setSaving(true);
    try {
      await assignPermissions(roleId, checkedKeys);
      message.success('权限配置保存成功');
    } catch {
      // handled by interceptor
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/role')}
        style={{ marginBottom: 16, padding: 0 }}
      >
        返回角色列表
      </Button>
      <Card
        title={`权限配置 - ${roleName}`}
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={handleSave}
          >
            保存权限
          </Button>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : (
          <PermissionTree
            treeData={treeData}
            checkedKeys={checkedKeys}
            onCheck={setCheckedKeys}
          />
        )}
      </Card>
    </div>
  );
};

export default PermissionConfig;
