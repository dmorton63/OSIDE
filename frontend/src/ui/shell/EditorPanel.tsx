import type { CSSProperties } from 'react';

import { useDebugSession, useDebugSessionState } from '../../debug/session/DebugSessionContext';
import { useWorkspaceActions } from '../../workspace/state/WorkspaceContext';
import { useWorkspaceState } from '../../workspace/state/WorkspaceContext';

const panelStyle: CSSProperties = {
  display: 'grid',
  gridTemplateRows: 'auto auto 1fr',
  gap: '0.9rem',
  height: '100%',
};

const tabsStyle: CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap',
};

const tabStyle: CSSProperties = {
  padding: '0.35rem 0.7rem',
  border: '1px solid #273244',
  background: '#18202b',
  color: '#dce6f2',
};

const editorSurfaceStyle: CSSProperties = {
  border: '1px solid #273244',
  background: 'linear-gradient(180deg, #121821 0%, #0f141b 100%)',
  padding: '1rem 0',
  display: 'grid',
  gap: '0.75rem',
  alignContent: 'start',
  overflow: 'auto',
};

const codeFrameStyle: CSSProperties = {
  display: 'grid',
  gap: '0.1rem',
  fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
  fontSize: '0.93rem',
  lineHeight: 1.55,
};

const codeLineStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1rem 3.25rem 1fr',
  gap: '0.75rem',
  padding: '0.02rem 1rem',
  alignItems: 'baseline',
};

const breakpointStyle: CSSProperties = {
  width: '0.6rem',
  height: '0.6rem',
  borderRadius: '999px',
  justifySelf: 'center',
  alignSelf: 'center',
};

const lineNumberStyle: CSSProperties = {
  color: '#526273',
  textAlign: 'right',
  userSelect: 'none',
};

function normalizeWorkspacePath(path: string, rootPath: string): string {
  if (path.startsWith(`${rootPath}/`)) {
    return path.slice(rootPath.length + 1);
  }

  return path;
}

export function EditorPanel() {
  const workspace = useWorkspaceState();
  const workspaceActions = useWorkspaceActions();
  const debugSession = useDebugSession();
  const debug = useDebugSessionState();
  const openTabs = workspace.openFilePaths;
  const activeFile = workspace.activeFilePath ?? openTabs[0] ?? null;
  const activeLine = debug.activeFrame && activeFile && normalizeWorkspacePath(debug.activeFrame.filePath, workspace.rootPath) === activeFile
    ? debug.activeFrame.line
    : null;
  const activeContent = activeFile ? workspace.fileContents[activeFile] ?? '' : '';
  const previewLines = activeFile ? activeContent.split(/\r?\n/) : [];
  const activeBreakpoints = activeFile
    ? debug.breakpoints.filter((breakpoint) => normalizeWorkspacePath(breakpoint.fileId, workspace.rootPath) === activeFile)
    : [];

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
        <strong>Editor</strong>
        <span style={{ color: '#8ea0b8' }}>active file: {activeFile ?? 'none'}</span>
      </div>
      <div style={tabsStyle}>
        {openTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => workspaceActions.openFile(tab)}
            style={{
              ...tabStyle,
              borderColor: tab === activeFile ? '#8dd694' : '#273244',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            {tab.split('/').at(-1)}
          </button>
        ))}
      </div>
      <div style={editorSurfaceStyle}>
        <div style={{ color: '#8ea0b8', padding: '0 1rem' }}>
          {activeLine ? `highlighting execution at line ${activeLine}` : 'debugger is not paused on a source line'}
        </div>
        {activeFile && activeContent ? (
          <div style={codeFrameStyle}>
            {previewLines.map((line, index) => {
              const lineNumber = index + 1;
              const isActiveLine = lineNumber === activeLine;
              const hasBreakpoint = activeBreakpoints.some((breakpoint) => breakpoint.line === lineNumber && breakpoint.enabled);

              return (
                <div
                  key={lineNumber}
                  style={{
                    ...codeLineStyle,
                    background: isActiveLine ? 'rgba(141, 214, 148, 0.14)' : 'transparent',
                    borderLeft: isActiveLine ? '3px solid #8dd694' : '3px solid transparent',
                  }}
                >
                  <span
                    style={{
                      ...breakpointStyle,
                      background: hasBreakpoint ? '#ff8f8f' : 'transparent',
                      border: hasBreakpoint ? '1px solid #ffb3b3' : '1px solid transparent',
                      cursor: activeFile ? 'pointer' : 'default',
                    }}
                    onClick={activeFile ? () => debugSession.toggleBreakpoint(activeFile, lineNumber) : undefined}
                  />
                  <span style={{ ...lineNumberStyle, color: isActiveLine ? '#8dd694' : '#526273' }}>{lineNumber}</span>
                  <span style={{ color: isActiveLine ? '#f6fff6' : '#dce6f2', whiteSpace: 'pre-wrap' }}>{line || ' '}</span>
                </div>
              );
            })}
          </div>
        ) : activeFile ? (
          <pre style={{ margin: 0, color: '#8ea0b8', padding: '0 1rem' }}>Loading {activeFile}...</pre>
        ) : (
          <pre style={{ margin: 0, color: '#8ea0b8', padding: '0 1rem' }}>Open a file from the project tree to view source.</pre>
        )}
        {debug.activeFrame ? (
          <div style={{ color: '#f1c27d', padding: '0 1rem' }}>
            paused at {debug.activeFrame.functionName} ({normalizeWorkspacePath(debug.activeFrame.filePath, workspace.rootPath)}:{debug.activeFrame.line})
          </div>
        ) : null}
      </div>
    </div>
  );
}