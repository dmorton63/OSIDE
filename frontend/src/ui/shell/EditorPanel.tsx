import type { CSSProperties } from 'react';

import { useDebugSessionState } from '../../debug/session/DebugSessionContext';
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
  padding: '1rem',
  display: 'grid',
  gap: '0.75rem',
  alignContent: 'start',
};

export function EditorPanel() {
  const workspace = useWorkspaceState();
  const debug = useDebugSessionState();
  const openTabs = [
    'samples/tinyos/src/kernel.cpp',
    'samples/tinyos/include/kernel.hpp',
    'samples/tinyos/project.json',
  ];
  const activeFile = debug.activeFrame?.filePath ?? openTabs[0] ?? workspace.rootPath;

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
        <div style={{ color: '#8ea0b8' }}>Execution line highlight and breakpoint gutter land here in the next iteration.</div>
        <pre style={{ margin: 0, color: '#dce6f2' }}>{`#include "kernel.hpp"

namespace {
int DetectBootStage() {
  return 1;
}
}

int KernelMain() {
  int bootStage = DetectBootStage();
  bool schedulerReady = bootStage > 1;
  int statusCode = schedulerReady ? 0 : bootStage;
  return statusCode;
}`}</pre>
        {debug.activeFrame ? (
          <div style={{ color: '#f1c27d' }}>
            paused at {debug.activeFrame.functionName} ({debug.activeFrame.filePath}:{debug.activeFrame.line})
          </div>
        ) : null}
      </div>
    </div>
  );
}