import { useState } from 'react';
import type { CSSProperties } from 'react';

import { useBuildOutputState, type BuildSeverity } from '../../build/state/BuildOutputContext';

const panelGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.4fr 1fr 1fr',
  gap: '1rem',
  height: '100%',
};

const sectionStyle: CSSProperties = {
  display: 'grid',
  gap: '0.75rem',
  alignContent: 'start',
  minHeight: 0,
};

const headingRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '0.75rem',
};

const badgeStyle: Record<string, CSSProperties> = {
  idle: { color: '#8ea0b8' },
  running: { color: '#f1c27d' },
  success: { color: '#8dd694' },
  failed: { color: '#ff8f8f' },
};

const filterBarStyle: CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap',
};

const buttonBaseStyle: CSSProperties = {
  background: '#18202b',
  border: '1px solid #273244',
  color: '#c8d4e3',
  padding: '0.3rem 0.6rem',
  cursor: 'pointer',
};

const listStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'grid',
  gap: '0.5rem',
};

const logEntryStyle = (stream: 'stdout' | 'stderr'): CSSProperties => ({
  color: stream === 'stderr' ? '#ffb6b6' : '#c8d4e3',
  whiteSpace: 'pre-wrap',
});

const diagnosticStyle = (severity: BuildSeverity): CSSProperties => ({
  borderLeft: `3px solid ${severity === 'error' ? '#ff8f8f' : severity === 'warning' ? '#f1c27d' : '#8ea0b8'}`,
  paddingLeft: '0.5rem',
});

export function BuildOutputPanel() {
  const buildOutput = useBuildOutputState();
  const [severityFilter, setSeverityFilter] = useState<'all' | BuildSeverity>('all');

  const diagnostics =
    severityFilter === 'all'
      ? buildOutput.diagnostics
      : buildOutput.diagnostics.filter((diagnostic) => diagnostic.severity === severityFilter);

  return (
    <div style={panelGridStyle}>
      <section style={sectionStyle}>
        <div style={headingRowStyle}>
          <strong>Build Output</strong>
          <span style={badgeStyle[buildOutput.status]}>status: {buildOutput.status}</span>
        </div>
        <ul style={listStyle}>
          {buildOutput.logs.map((entry, index) => (
            <li key={`${entry.stream}-${index}`} style={logEntryStyle(entry.stream)}>
              [{entry.stream}] {entry.text}
            </li>
          ))}
        </ul>
      </section>

      <section style={sectionStyle}>
        <div style={headingRowStyle}>
          <strong>Diagnostics</strong>
          <span>{diagnostics.length}</span>
        </div>
        <div style={filterBarStyle}>
          {(['all', 'error', 'warning', 'info'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setSeverityFilter(filter)}
              style={{
                ...buttonBaseStyle,
                borderColor: severityFilter === filter ? '#8dd694' : '#273244',
              }}
            >
              {filter}
            </button>
          ))}
        </div>
        {diagnostics.length === 0 ? (
          <div style={{ color: '#8ea0b8' }}>No diagnostics for this build.</div>
        ) : (
          <ul style={listStyle}>
            {diagnostics.map((diagnostic) => (
              <li key={`${diagnostic.filePath}:${diagnostic.line}:${diagnostic.message}`} style={diagnosticStyle(diagnostic.severity)}>
                <div>{diagnostic.message}</div>
                <div style={{ color: '#8ea0b8' }}>
                  {diagnostic.filePath}:{diagnostic.line}
                  {diagnostic.column ? `:${diagnostic.column}` : ''}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={sectionStyle}>
        <div style={headingRowStyle}>
          <strong>Artifacts</strong>
          <span>{buildOutput.artifacts.length}</span>
        </div>
        <ul style={listStyle}>
          {buildOutput.artifacts.map((artifact) => (
            <li key={`${artifact.kind}:${artifact.path}`}>
              <div>{artifact.kind}</div>
              <div style={{ color: '#8ea0b8' }}>{artifact.path}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}