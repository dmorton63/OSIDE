import type { CSSProperties } from 'react';

import { useWorkspaceActions } from '../../workspace/state/WorkspaceContext';
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

const treeButtonStyle: CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: '#b7c6d9',
  padding: 0,
  textAlign: 'left',
  cursor: 'pointer',
  font: 'inherit',
};

function WorkspaceTree({ nodes, activeFilePath, onOpenFile }: { nodes: WorkspaceNode[]; activeFilePath: string | null; onOpenFile: (filePath: string) => void }) {
  return (
    <ul style={treeListStyle}>
      {nodes.map((node) => (
        <li key={node.path} style={treeItemStyle}>
          {node.kind === 'directory' ? (
            <span style={treeLabelStyle}>{`/${node.name}`}</span>
          ) : (
            <button
              type="button"
              style={{
                ...treeButtonStyle,
                color: activeFilePath === node.path ? '#8dd694' : '#b7c6d9',
              }}
              onClick={() => onOpenFile(node.path)}
            >
              {node.name}
            </button>
          )}
          {node.children && node.children.length > 0 ? <WorkspaceTree nodes={node.children} activeFilePath={activeFilePath} onOpenFile={onOpenFile} /> : null}
        </li>
      ))}
    </ul>
  );
}

export function ProjectPanel() {
  const workspace = useWorkspaceState();
  const workspaceActions = useWorkspaceActions();

  return (
    <div style={panelStyle}>
      <strong>Project Tree</strong>
      <div style={{ color: '#8ea0b8' }}>{workspace.rootPath}</div>
      <div style={{ color: '#8ea0b8' }}>modules: {workspace.modules.join(', ')}</div>
      <WorkspaceTree nodes={workspace.tree} activeFilePath={workspace.activeFilePath} onOpenFile={workspaceActions.openFile} />
    </div>
  );
}