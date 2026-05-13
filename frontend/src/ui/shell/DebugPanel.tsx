import type { CSSProperties } from 'react';

import { useDebugSessionState } from '../../debug/session/DebugSessionContext';

const panelStyle: CSSProperties = {
  display: 'grid',
  gap: '0.85rem',
  alignContent: 'start',
};

const sectionStyle: CSSProperties = {
  display: 'grid',
  gap: '0.35rem',
};

const listStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'grid',
  gap: '0.4rem',
};

const statusColor: Record<string, string> = {
  running: '#8dd694',
  paused: '#f1c27d',
  stopped: '#8ea0b8',
};

export function DebugPanel() {
  const debug = useDebugSessionState();

  return (
    <div style={panelStyle}>
      <section style={sectionStyle}>
        <strong>Debugger</strong>
        <div style={{ color: statusColor[debug.status] }}>status: {debug.status}</div>
        <div style={{ color: '#8ea0b8' }}>target: {debug.target ?? 'none'}</div>
      </section>

      <section style={sectionStyle}>
        <strong>Activity</strong>
        <div style={{ color: debug.pendingCommand ? '#f1c27d' : '#8ea0b8' }}>
          {debug.pendingCommand ? `awaiting: ${debug.pendingCommand}` : 'idle'}
        </div>
        {debug.activity.length === 0 ? (
          <div style={{ color: '#8ea0b8' }}>No debug activity yet.</div>
        ) : (
          <ul style={listStyle}>
            {debug.activity.map((entry, index) => (
              <li key={`${entry}:${index}`} style={{ color: entry.startsWith('command:') ? '#8dd694' : '#8ea0b8' }}>
                {entry}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={sectionStyle}>
        <strong>Threads</strong>
        <ul style={listStyle}>
          {debug.threads.map((thread) => (
            <li key={thread.threadId}>
              <div>{thread.name ?? thread.threadId}</div>
              <div style={{ color: '#8ea0b8' }}>{thread.status}</div>
            </li>
          ))}
        </ul>
      </section>

      <section style={sectionStyle}>
        <strong>Frame</strong>
        {debug.activeFrame ? (
          <>
            <div>{debug.activeFrame.functionName}</div>
            <div style={{ color: '#8ea0b8' }}>
              {debug.activeFrame.filePath}:{debug.activeFrame.line}
            </div>
          </>
        ) : (
          <div style={{ color: '#8ea0b8' }}>No active frame.</div>
        )}
      </section>

      <section style={sectionStyle}>
        <strong>Breakpoints</strong>
        <ul style={listStyle}>
          {debug.breakpoints.map((breakpoint) => (
            <li key={breakpoint.id}>
              <div>{breakpoint.fileId}</div>
              <div style={{ color: '#8ea0b8' }}>line {breakpoint.line}</div>
            </li>
          ))}
        </ul>
      </section>

      <section style={sectionStyle}>
        <strong>Variables</strong>
        {debug.variables.length === 0 ? (
          <div style={{ color: '#8ea0b8' }}>No locals loaded.</div>
        ) : (
          <ul style={listStyle}>
            {debug.variables.map((variable) => (
              <li key={`${variable.name}:${variable.address ?? 'na'}`}>
                <div>{variable.name}</div>
                <div style={{ color: '#8ea0b8' }}>
                  {variable.type} = {variable.value}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={sectionStyle}>
        <strong>Registers</strong>
        {debug.registers.length === 0 ? (
          <div style={{ color: '#8ea0b8' }}>No registers loaded.</div>
        ) : (
          <ul style={listStyle}>
            {debug.registers.map((register) => (
              <li key={register.name}>
                <div>{register.name}</div>
                <div style={{ color: register.changed ? '#8dd694' : '#8ea0b8' }}>{register.value}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}