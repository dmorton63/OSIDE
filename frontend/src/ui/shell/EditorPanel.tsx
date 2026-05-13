import type { CSSProperties } from 'react';

import { useDebugSessionState } from '../../debug/session/DebugSessionContext';
import { useWorkspaceState } from '../../workspace/state/WorkspaceContext';

const kernelSourceLines = [
  '#include "kernel.hpp"',
  '',
  'namespace {',
  '',
  'int DetectBootStage() {',
  '  return 1;',
  '}',
  '',
  'bool InitializeScheduler(int bootStage) {',
  '  return bootStage > 1;',
  '}',
  '',
  '} // namespace',
  '',
  'int KernelMain() {',
  '  int bootStage = DetectBootStage();',
  '  bool schedulerReady = InitializeScheduler(bootStage);',
  '  int statusCode = schedulerReady ? 0 : bootStage;',
  '  return statusCode;',
  '}',
];

const sourcePreviewByPath: Record<string, string[]> = {
  'samples/tinyos/src/kernel.cpp': kernelSourceLines,
};

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
  gridTemplateColumns: '3.25rem 1fr',
  gap: '0.9rem',
  padding: '0.02rem 1rem',
  alignItems: 'baseline',
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
};

export function EditorPanel() {
  const workspace = useWorkspaceState();
  const debug = useDebugSessionState();
  const openTabs = [
    'samples/tinyos/src/kernel.cpp',
    'samples/tinyos/include/kernel.hpp',
    'samples/tinyos/project.json',
  ];
  const activeFile = normalizeWorkspacePath(debug.activeFrame?.filePath ?? openTabs[0] ?? workspace.rootPath, workspace.rootPath);
  const activeLine = debug.activeFrame && normalizeWorkspacePath(debug.activeFrame.filePath, workspace.rootPath) === activeFile
    ? debug.activeFrame.line
    : null;
  const previewLines = sourcePreviewByPath[activeFile];

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
        <strong>Editor</strong>
        <span style={{ color: '#8ea0b8' }}>active file: {activeFile}</span>
      </div>
      <div style={tabsStyle}>
        {openTabs.map((tab) => (
          <div key={tab} style={{ ...tabStyle, borderColor: tab === activeFile ? '#8dd694' : '#273244' }}>
            {tab.split('/').at(-1)}
          </div>
        ))}
      </div>
      <div style={editorSurfaceStyle}>
        <div style={{ color: '#8ea0b8', padding: '0 1rem' }}>
          {activeLine ? `highlighting execution at line ${activeLine}` : 'debugger is not paused on a source line'}
        </div>
        {previewLines ? (
          <div style={codeFrameStyle}>
            {previewLines.map((line, index) => {
              const lineNumber = index + 1;
              const isActiveLine = lineNumber === activeLine;

              return (
                <div
                  key={lineNumber}
                  style={{
                    ...codeLineStyle,
                    background: isActiveLine ? 'rgba(141, 214, 148, 0.14)' : 'transparent',
                    borderLeft: isActiveLine ? '3px solid #8dd694' : '3px solid transparent',
                  }}
                >
                  <span style={{ ...lineNumberStyle, color: isActiveLine ? '#8dd694' : '#526273' }}>{lineNumber}</span>
                  <span style={{ color: isActiveLine ? '#f6fff6' : '#dce6f2', whiteSpace: 'pre-wrap' }}>{line || ' '}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <pre style={{ margin: 0, color: '#dce6f2', padding: '0 1rem' }}>Preview unavailable for {activeFile}</pre>
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