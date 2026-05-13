import { useState } from 'react';
import type { CSSProperties } from 'react';

import { useProtocol } from '../../protocol/hooks/ProtocolContext';
import { useDebugSession } from '../../debug/session/DebugSessionContext';
import { useDebugSessionState } from '../../debug/session/DebugSessionContext';
import { useWorkspaceActions } from '../../workspace/state/WorkspaceContext';
import { useWorkspaceState } from '../../workspace/state/WorkspaceContext';
import { BuildOutputPanel } from './BuildOutputPanel';
import { DebugPanel } from './DebugPanel';
import { EditorPanel } from './EditorPanel';
import { ProjectPanel } from './ProjectPanel';
import { WorkbenchToolbar, type LayoutMode } from './WorkbenchToolbar';

const paneStyle: CSSProperties = {
  border: '1px solid #273244',
  padding: '0.9rem',
};

function createShellStyle(mode: LayoutMode): CSSProperties {
  if (mode === 'minimal') {
    return {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gridTemplateRows: '56px 1fr',
      gridTemplateAreas: `'toolbar' 'editor'`,
      minHeight: '100vh',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      background: '#11161d',
      color: '#e7edf5',
    };
  }

  if (mode === 'editing') {
    return {
      display: 'grid',
      gridTemplateColumns: '260px 1fr',
      gridTemplateRows: '56px 1fr 180px',
      gridTemplateAreas: `'toolbar toolbar' 'project editor' 'output output'`,
      minHeight: '100vh',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      background: '#11161d',
      color: '#e7edf5',
    };
  }

  if (mode === 'module') {
    return {
      display: 'grid',
      gridTemplateColumns: '260px 1fr 320px',
      gridTemplateRows: '56px 1fr 180px',
      gridTemplateAreas: `'toolbar toolbar toolbar' 'project editor debug' 'output output output'`,
      minHeight: '100vh',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      background: '#11161d',
      color: '#e7edf5',
    };
  }

  return {
    display: 'grid',
    gridTemplateColumns: '260px 1fr 340px',
    gridTemplateRows: '56px 1fr 220px',
    gridTemplateAreas: `'toolbar toolbar toolbar' 'project editor debug' 'output output output'`,
    minHeight: '100vh',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    background: '#11161d',
    color: '#e7edf5',
  };
}

export function Workbench() {
  const protocol = useProtocol();
  const debugSession = useDebugSession();
  const debugState = useDebugSessionState();
  const workspaceActions = useWorkspaceActions();
  const workspace = useWorkspaceState();
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('editing');
  const shellStyle = createShellStyle(layoutMode);
  const debugTarget = `${workspace.rootPath}/build/tinyos-kernel.elf`;
  const showDebugControls = (layoutMode === 'debugging' || layoutMode === 'module' || debugState.status !== 'stopped' || debugState.pendingCommand !== null);

  const sendDebugCommand = (type: string, payload: Record<string, unknown> = {}) => {
    if (protocol.connectionState !== 'connected') {
      return;
    }

    debugSession.recordCommand(type);
    protocol.sendMessage({
      protocolVersion: '1.0.0',
      type,
      payload,
    });
  };

  const handleBuild = () => {
    if (protocol.connectionState !== 'connected') {
      return;
    }

    protocol.sendMessage({
      protocolVersion: '1.0.0',
      type: 'build.start',
      payload: {
        configuration: 'Debug',
        rootPath: workspace.rootPath,
      },
    });
  };

  const handleDebug = () => {
    if (protocol.connectionState !== 'connected') {
      return;
    }

    setLayoutMode('debugging');
    sendDebugCommand('debug.start', {
      target: debugTarget,
    });
  };

  return (
    <div style={shellStyle}>
      <header style={{ ...paneStyle, gridArea: 'toolbar' }}>
        <WorkbenchToolbar
          projectName={workspace.projectName}
          connectionState={protocol.connectionState}
          activeLayout={layoutMode}
          projectRootPath={workspace.rootPath}
          debugStatus={debugState.status}
          debugPendingCommand={debugState.pendingCommand}
          showDebugControls={showDebugControls}
          onOpenProject={workspaceActions.loadProject}
          onLayoutChange={setLayoutMode}
          onBuild={handleBuild}
          onDebug={handleDebug}
          onDebugStart={() => sendDebugCommand('debug.start', { target: debugTarget })}
          onDebugPause={() => sendDebugCommand('debug.pause')}
          onDebugContinue={() => sendDebugCommand('debug.continue')}
          onDebugStepInto={() => sendDebugCommand('debug.stepInto')}
          onDebugStepOver={() => sendDebugCommand('debug.stepOver')}
          onDebugStepOut={() => sendDebugCommand('debug.stepOut')}
          onDebugStop={() => sendDebugCommand('debug.stop')}
        />
      </header>
      {layoutMode !== 'minimal' ? (
        <aside style={{ ...paneStyle, gridArea: 'project' }}>
          <ProjectPanel />
        </aside>
      ) : null}
      <main style={{ ...paneStyle, gridArea: 'editor' }}>
        <EditorPanel />
      </main>
      {layoutMode === 'debugging' || layoutMode === 'module' ? (
        <aside style={{ ...paneStyle, gridArea: 'debug' }}>
          <DebugPanel />
        </aside>
      ) : null}
      {layoutMode !== 'minimal' ? (
        <footer style={{ ...paneStyle, gridArea: 'output' }}>
          <BuildOutputPanel />
          <div style={{ color: '#8ea0b8', marginTop: '0.75rem' }}>last inbound message: {protocol.lastMessageType ?? 'none'}</div>
        </footer>
      ) : null}
    </div>
  );
}
