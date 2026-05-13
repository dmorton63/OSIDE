import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { useProtocol } from '../../protocol/hooks/ProtocolContext';

export type BuildSeverity = 'error' | 'warning' | 'info';
export type BuildArtifactKind = 'object' | 'kernel' | 'module' | 'map' | 'log';
export type BuildLogStream = 'stdout' | 'stderr';
export type BuildStatus = 'idle' | 'running' | 'success' | 'failed';

export type BuildDiagnostic = {
  filePath: string;
  line: number;
  column?: number;
  severity: BuildSeverity;
  message: string;
};

export type BuildArtifact = {
  kind: BuildArtifactKind;
  path: string;
};

export type BuildLogEntry = {
  stream: BuildLogStream;
  text: string;
};

export type BuildOutputState = {
  status: BuildStatus;
  diagnostics: BuildDiagnostic[];
  artifacts: BuildArtifact[];
  logs: BuildLogEntry[];
};

const initialBuildState: BuildOutputState = {
  status: 'idle',
  diagnostics: [],
  artifacts: [],
  logs: [],
};

const BuildOutputContext = createContext<BuildOutputState>(initialBuildState);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isBuildOutputPayload(value: unknown): value is BuildLogEntry {
  return isRecord(value) && (value.stream === 'stdout' || value.stream === 'stderr') && typeof value.text === 'string';
}

function isBuildDiagnostic(value: unknown): value is BuildDiagnostic {
  return (
    isRecord(value) &&
    typeof value.filePath === 'string' &&
    typeof value.line === 'number' &&
    (value.column === undefined || typeof value.column === 'number') &&
    (value.severity === 'error' || value.severity === 'warning' || value.severity === 'info') &&
    typeof value.message === 'string'
  );
}

function isBuildArtifact(value: unknown): value is BuildArtifact {
  return (
    isRecord(value) &&
    (value.kind === 'object' || value.kind === 'kernel' || value.kind === 'module' || value.kind === 'map' || value.kind === 'log') &&
    typeof value.path === 'string'
  );
}

function isBuildCompletePayload(value: unknown): value is { success: boolean; diagnostics: BuildDiagnostic[]; artifacts: BuildArtifact[] } {
  return (
    isRecord(value) &&
    typeof value.success === 'boolean' &&
    Array.isArray(value.diagnostics) &&
    value.diagnostics.every(isBuildDiagnostic) &&
    Array.isArray(value.artifacts) &&
    value.artifacts.every(isBuildArtifact)
  );
}

export function BuildOutputProvider({ children }: PropsWithChildren) {
  const protocol = useProtocol();
  const [buildState, setBuildState] = useState<BuildOutputState>(initialBuildState);

  useEffect(() => {
    protocol.registerHandler('build.output', (payload) => {
      if (!isBuildOutputPayload(payload)) {
        return;
      }

      if (payload.text === 'Build requested') {
        setBuildState({
          status: 'running',
          diagnostics: [],
          artifacts: [],
          logs: [payload],
        });
        return;
      }

      setBuildState((current) => ({
        ...current,
        status: 'running',
        logs: [...current.logs, payload],
      }));
    });

    protocol.registerHandler('build.diagnostic', (payload) => {
      if (!isBuildDiagnostic(payload)) {
        return;
      }

      setBuildState((current) => ({
        ...current,
        diagnostics: [...current.diagnostics, payload],
      }));
    });

    protocol.registerHandler('build.complete', (payload) => {
      if (!isBuildCompletePayload(payload)) {
        return;
      }

      setBuildState((current) => ({
        ...current,
        status: payload.success ? 'success' : 'failed',
        diagnostics: payload.diagnostics,
        artifacts: payload.artifacts,
      }));
    });
  }, [protocol]);

  const value = useMemo(() => buildState, [buildState]);

  return <BuildOutputContext.Provider value={value}>{children}</BuildOutputContext.Provider>;
}

export function useBuildOutputState() {
  return useContext(BuildOutputContext);
}