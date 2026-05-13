import { useEffect, useState } from 'react';
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
  paddingLeft: '0.35rem',
  borderLeft: '2px solid transparent',
};

const treeLabelStyle: CSSProperties = {
  color: '#b7c6d9',
  fontSize: '0.95rem',
};

const directoryButtonStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem',
  border: 'none',
  background: 'transparent',
  color: '#b7c6d9',
  padding: 0,
  textAlign: 'left',
  cursor: 'pointer',
  font: 'inherit',
};

const directoryChevronStyle: CSSProperties = {
  display: 'inline-block',
  width: '0.8rem',
  color: '#8ea0b8',
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

function nodeContainsActiveFile(node: WorkspaceNode, activeFilePath: string | null): boolean {
  if (!activeFilePath) {
    return false;
  }

  if (node.kind === 'file') {
    return node.path === activeFilePath;
  }

  return node.children?.some((child) => nodeContainsActiveFile(child, activeFilePath)) ?? false;
}

function collectDirectoryPaths(nodes: WorkspaceNode[]): string[] {
  const paths: string[] = [];

  for (const node of nodes) {
    if (node.kind === 'directory') {
      paths.push(node.path);
      if (node.children) {
        paths.push(...collectDirectoryPaths(node.children));
      }
    }
  }

  return paths;
}

function collectActiveBranchPaths(nodes: WorkspaceNode[], activeFilePath: string | null): string[] {
  const paths: string[] = [];

  for (const node of nodes) {
    if (node.kind !== 'directory' || !nodeContainsActiveFile(node, activeFilePath)) {
      continue;
    }

    paths.push(node.path);
    if (node.children) {
      paths.push(...collectActiveBranchPaths(node.children, activeFilePath));
    }
  }

  return paths;
}

function WorkspaceTree({
  nodes,
  activeFilePath,
  expandedPaths,
  onOpenFile,
  onToggleDirectory,
}: {
  nodes: WorkspaceNode[];
  activeFilePath: string | null;
  expandedPaths: Set<string>;
  onOpenFile: (filePath: string) => void;
  onToggleDirectory: (path: string) => void;
}) {
  return (
    <ul style={treeListStyle}>
      {nodes.map((node) => {
        const isActiveBranch = nodeContainsActiveFile(node, activeFilePath);
        const isExpanded = node.kind === 'directory' ? expandedPaths.has(node.path) : false;

        return (
          <li
            key={node.path}
            style={{
              ...treeItemStyle,
              borderLeftColor: isActiveBranch ? '#8dd694' : 'transparent',
            }}
          >
            {node.kind === 'directory' ? (
              <button
                type="button"
                style={{
                  ...directoryButtonStyle,
                  color: isActiveBranch ? '#8dd694' : '#b7c6d9',
                  fontWeight: isActiveBranch ? 600 : 400,
                }}
                onClick={() => onToggleDirectory(node.path)}
              >
                <span style={directoryChevronStyle}>{isExpanded ? 'v' : '>'}</span>
                <span>{`/${node.name}`}</span>
              </button>
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
            {node.children && node.children.length > 0 && isExpanded ? (
              <WorkspaceTree
                nodes={node.children}
                activeFilePath={activeFilePath}
                expandedPaths={expandedPaths}
                onOpenFile={onOpenFile}
                onToggleDirectory={onToggleDirectory}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function ProjectPanel() {
  const workspace = useWorkspaceState();
  const workspaceActions = useWorkspaceActions();
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  useEffect(() => {
    setExpandedPaths(new Set(collectDirectoryPaths(workspace.tree)));
  }, [workspace.tree]);

  useEffect(() => {
    const activeBranchPaths = collectActiveBranchPaths(workspace.tree, workspace.activeFilePath);
    if (activeBranchPaths.length === 0) {
      return;
    }

    setExpandedPaths((current) => {
      const next = new Set(current);
      for (const path of activeBranchPaths) {
        next.add(path);
      }
      return next;
    });
  }, [workspace.activeFilePath, workspace.tree]);

  const handleToggleDirectory = (path: string) => {
    setExpandedPaths((current) => {
      const next = new Set(current);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  return (
    <div style={panelStyle}>
      <strong>Project Tree</strong>
      <div style={{ color: '#8ea0b8' }}>{workspace.rootPath}</div>
      <div style={{ color: '#8ea0b8' }}>modules: {workspace.modules.join(', ')}</div>
      <WorkspaceTree
        nodes={workspace.tree}
        activeFilePath={workspace.activeFilePath}
        expandedPaths={expandedPaths}
        onOpenFile={workspaceActions.openFile}
        onToggleDirectory={handleToggleDirectory}
      />
    </div>
  );
}