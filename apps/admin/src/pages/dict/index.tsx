import React, { useState, useEffect, useCallback } from 'react';
import { Card, Collapse, Tag } from 'antd';
import { listDictGroups, type DictGroup } from './services/dict';
import DictTable from './components/DictTable';

const DictManagement: React.FC = () => {
  const [groups, setGroups] = useState<DictGroup[]>([]);

  const fetchGroups = useCallback(async () => {
    try {
      const result = await listDictGroups();
      setGroups(Array.isArray(result) ? result : []);
    } catch {
      // handled by interceptor
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const collapseItems = groups.map((group) => ({
    key: group.code,
    label: (
      <span>
        {group.name}
        <Tag style={{ marginLeft: 8 }}>{group.code}</Tag>
        {group.description && (
          <span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>
            {group.description}
          </span>
        )}
      </span>
    ),
    children: <DictTable groupCode={group.code} />,
  }));

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>字典管理</h2>
      <Card>
        <Collapse items={collapseItems} defaultActiveKey={collapseItems.map((item) => item.key)} />
      </Card>
    </div>
  );
};

export default DictManagement;
