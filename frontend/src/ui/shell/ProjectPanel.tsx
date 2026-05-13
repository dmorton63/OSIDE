import type { CSSProperties } from 'react';

import { useWorkspaceState, type WorkspaceNode } from '../../workspace/state/WorkspaceContext';

const panelStyle: CSSProperties = {
  display: 'grid',
  gap: '0.75rem',
  alignContent: 'start',
};

const treeListStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'grid',
  gap: '0.35rem',
};

const treeItemStyle: CSSProperties = {
  display: 'grid',
  gap: '0.35rem',
};

const treeLabelStyle: CSSProperties = {
  color: '#b7c6d9',
  fontSize: '0.95rem',
};

function WorkspaceTree({ nodes }: { nodes: WorkspaceNode[] }) {
  return (
    <ul style={treeListStyle}>
      {nodes.map((node) => (
        <li key={node.path} style={treeItemStyle}>
          <span style={treeLabelStyle}>{node.kind === 'directory' ? `/${node.name}` : node.name}</span>
          {node.children && node.children.length > 0 ? <WorkspaceTree nodes={node.children} /> : null}
        </li>
      ))}
    </ul>
  );
}

export function ProjectPanel() {
  const workspace = useWorkspaceState();

  return (
    <div style={panelStyle}>
      <strong>Project Tree</strong>
      <div style={{ color: '#8ea0b8' }}>{workspace.rootPath}</div>
      <div style={{ color: '#8ea0b8' }}>modules: {workspace.modules.join(', ')}</div>
      <WorkspaceTree nodes={workspace.tree} />
    </div>
  );
}