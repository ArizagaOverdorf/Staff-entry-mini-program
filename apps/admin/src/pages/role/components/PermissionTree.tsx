import React from 'react';
import { Tree, Button, Space } from 'antd';
import type { DataNode, TreeProps } from 'antd/es/tree';
import type { PermissionNode } from '../services/role';

interface PermissionTreeProps {
  treeData: PermissionNode[];
  checkedKeys: string[];
  onCheck: (keys: string[]) => void;
}

function convertToTreeData(nodes: PermissionNode[]): DataNode[] {
  return nodes.map((node) => ({
    key: node.id,
    title: `${node.name} (${node.code})`,
    children: node.children ? convertToTreeData(node.children) : undefined,
  }));
}

const PermissionTree: React.FC<PermissionTreeProps> = ({
  treeData,
  checkedKeys,
  onCheck,
}) => {
  const handleCheck: TreeProps['onCheck'] = (checked) => {
    if (Array.isArray(checked)) {
      onCheck(checked as string[]);
    }
  };

  const handleSelectAll = () => {
    const allIds = flattenIds(treeData);
    onCheck(allIds);
  };

  const handleClearAll = () => {
    onCheck([]);
  };

  function flattenIds(nodes: PermissionNode[]): string[] {
    const ids: string[] = [];
    for (const node of nodes) {
      ids.push(node.id);
      if (node.children) {
        ids.push(...flattenIds(node.children));
      }
    }
    return ids;
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button size="small" onClick={handleSelectAll}>全选</Button>
        <Button size="small" onClick={handleClearAll}>取消全选</Button>
      </Space>
      <Tree
        checkable
        defaultExpandAll
        treeData={convertToTreeData(treeData)}
        checkedKeys={checkedKeys}
        onCheck={handleCheck}
      />
    </div>
  );
};

export default PermissionTree;
