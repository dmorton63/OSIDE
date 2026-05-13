import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

export type LayoutMode = 'editing' | 'debugging' | 'module' | 'minimal';

type DebugControlState = 'running' | 'paused' | 'stopped';

type WorkbenchToolbarProps = {
  projectName: string;
  connectionState: 'connecting' | 'connected' | 'disconnected';
  activeLayout: LayoutMode;
  projectRootPath: string;
  debugStatus: DebugControlState;
  debugPendingCommand: string | null;
  showDebugControls: boolean;
  onOpenProject: (rootPath: string) => void;
  onLayoutChange: (mode: LayoutMode) => void;
  onBuild: () => void;
  onDebug: () => void;
  onDebugStart: () => void;
  onDebugPause: () => void;
  onDebugContinue: () => void;
  onDebugStepInto: () => void;
  onDebugStepOver: () => void;
  onDebugStepOut: () => void;
  onDebugStop: () => void;
};

const toolbarStyle: CSSProperties = {
  display: 'grid',
  gap: '0.65rem',
};

const clusterStyle: CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  alignItems: 'center',
  flexWrap: 'wrap',
};

const primaryRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  flexWrap: 'wrap',
};

const projectOpenStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.45rem',
  flexWrap: 'wrap',
};

const debugRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  flexWrap: 'wrap',
  paddingTop: '0.15rem',
  borderTop: '1px solid #273244',
};

const buttonStyle: CSSProperties = {
  border: '1px solid #273244',
  background: '#18202b',
  color: '#dce6f2',
  padding: '0.3rem 0.65rem',
  cursor: 'pointer',
};

const inputStyle: CSSProperties = {
  border: '1px solid #273244',
  background: '#10161f',
  color: '#dce6f2',
  padding: '0.34rem 0.55rem',
  minWidth: '18rem',
};

const statusColor = {
  connecting: '#f1c27d',
  connected: '#8dd694',
  disconnected: '#ff8f8f',
} as const;

const debugStatusColor: Record<DebugControlState, string> = {
  running: '#8dd694',
  paused: '#f1c27d',
  stopped: '#8ea0b8',
};

export function WorkbenchToolbar({
  projectName,
  connectionState,
  activeLayout,
  projectRootPath,
  debugStatus,
  debugPendingCommand,
  showDebugControls,
  onOpenProject,
  onLayoutChange,
  onBuild,
  onDebug,
  onDebugStart,
  onDebugPause,
  onDebugContinue,
  onDebugStepInto,
  onDebugStepOver,
  onDebugStepOut,
  onDebugStop,
}: WorkbenchToolbarProps) {
  const controlsDisabled = connectionState !== 'connected';
  const [projectRootInput, setProjectRootInput] = useState(projectRootPath);

  useEffect(() => {
    setProjectRootInput(projectRootPath);
  }, [projectRootPath]);

  return (
    <div style={toolbarStyle}>
      <div style={primaryRowStyle}>
        <strong>oside</strong>
        <span>{projectName} workbench</span>
        <div style={projectOpenStyle}>
          <input
            type="text"
            value={projectRootInput}
            onChange={(event) => setProjectRootInput(event.target.value)}
            style={inputStyle}
            spellCheck={false}
            placeholder="project root"
          />
          <button
            type="button"
            style={buttonStyle}
            disabled={controlsDisabled || projectRootInput.trim().length === 0}
            onClick={() => onOpenProject(projectRootInput.trim())}
          >
            Open Project
          </button>
        </div>
        <div style={clusterStyle}>
          <button type="button" style={buttonStyle} onClick={onBuild} disabled={controlsDisabled}>Build</button>
          <button type="button" style={buttonStyle} onClick={onDebug} disabled={controlsDisabled}>Debug</button>
        </div>
        <div style={{ ...clusterStyle, marginLeft: 'auto' }}>
          {(['editing', 'debugging', 'module', 'minimal'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onLayoutChange(mode)}
              style={{
                ...buttonStyle,
                borderColor: activeLayout === mode ? '#8dd694' : '#273244',
                color: activeLayout === mode ? '#8dd694' : '#dce6f2',
              }}
            >
              {mode}
            </button>
          ))}
          <span style={{ color: statusColor[connectionState] }}>protocol: {connectionState}</span>
        </div>
      </div>

      {showDebugControls ? (
        <div style={debugRowStyle}>
          <strong style={{ color: '#8ea0b8' }}>debug</strong>
          <span style={{ color: debugStatusColor[debugStatus] }}>status: {debugStatus}</span>
          <span style={{ color: debugPendingCommand ? '#f1c27d' : '#8ea0b8' }}>
            {debugPendingCommand ? `awaiting: ${debugPendingCommand}` : 'idle'}
          </span>
          <div style={clusterStyle}>
            <button type="button" style={buttonStyle} disabled={controlsDisabled} onClick={onDebugStart}>Start</button>
            <button type="button" style={buttonStyle} disabled={controlsDisabled || debugStatus !== 'running'} onClick={onDebugPause}>Pause</button>
            <button type="button" style={buttonStyle} disabled={controlsDisabled || debugStatus !== 'paused'} onClick={onDebugContinue}>Continue</button>
            <button type="button" style={buttonStyle} disabled={controlsDisabled || debugStatus !== 'paused'} onClick={onDebugStepInto}>Step Into</button>
            <button type="button" style={buttonStyle} disabled={controlsDisabled || debugStatus !== 'paused'} onClick={onDebugStepOver}>Step Over</button>
            <button type="button" style={buttonStyle} disabled={controlsDisabled || debugStatus !== 'paused'} onClick={onDebugStepOut}>Step Out</button>
            <button type="button" style={buttonStyle} disabled={controlsDisabled || debugStatus === 'stopped'} onClick={onDebugStop}>Stop</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}