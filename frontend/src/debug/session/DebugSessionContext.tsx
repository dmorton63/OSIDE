import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { useProtocol } from '../../protocol/hooks/ProtocolContext';

export type DebugSessionStatus = 'running' | 'paused' | 'stopped';

export type DebugFrame = {
  frameId: string;
  filePath: string;
  line: number;
  functionName: string;
};

export type DebugThread = {
  threadId: string;
  name?: string;
  status: DebugSessionStatus;
  activeFrameId?: string;
};

export type DebugBreakpoint = {
  id: string;
  fileId: string;
  line: number;
  enabled: boolean;
  condition?: string;
};

export type DebugVariable = {
  name: string;
  type: string;
  value: string;
  address?: string;
  hasChildren?: boolean;
};

export type DebugRegister = {
  name: string;
  value: string;
  category: 'gpr' | 'fpu' | 'simd';
  changed?: boolean;
};

export type DebugSessionState = {
  sessionId: string | null;
  status: DebugSessionStatus;
  target: string | null;
  moduleIds: string[];
  activeFrame: DebugFrame | null;
  frames: DebugFrame[];
  threads: DebugThread[];
  breakpoints: DebugBreakpoint[];
  variables: DebugVariable[];
  registers: DebugRegister[];
  pendingCommand: string | null;
  activity: string[];
};

type DebugSessionContextValue = {
  state: DebugSessionState;
  recordCommand: (command: string) => void;
  toggleBreakpoint: (fileId: string, line: number) => void;
};

const initialDebugState: DebugSessionState = {
  sessionId: null,
  status: 'stopped',
  target: null,
  moduleIds: [],
  activeFrame: null,
  frames: [],
  threads: [],
  breakpoints: [
    {
      id: 'bp-kernel-main',
      fileId: 'samples/tinyos/src/kernel.cpp',
      line: 3,
      enabled: true,
    },
  ],
  variables: [],
  registers: [],
  pendingCommand: null,
  activity: [],
};

const DebugSessionContext = createContext<DebugSessionContextValue>({
  state: initialDebugState,
  recordCommand: () => {},
  toggleBreakpoint: () => {},
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function appendActivity(current: DebugSessionState, message: string, clearPending = true): DebugSessionState {
  return {
    ...current,
    pendingCommand: clearPending ? null : current.pendingCommand,
    activity: [message, ...current.activity].slice(0, 8),
  };
}

export function DebugSessionProvider({ children }: PropsWithChildren) {
  const protocol = useProtocol();
  const [debugState, setDebugState] = useState<DebugSessionState>(initialDebugState);

  useEffect(() => {
    protocol.registerHandler('debug.sessionStarted', (payload) => {
      if (!isRecord(payload) || typeof payload.sessionId !== 'string' || typeof payload.status !== 'string' || typeof payload.target !== 'string') {
        return;
      }

      const sessionId = payload.sessionId;
      const status = payload.status as DebugSessionStatus;
      const target = payload.target;
      const moduleIds = Array.isArray(payload.moduleIds) ? payload.moduleIds.filter((value): value is string => typeof value === 'string') : [];

      setDebugState((current) => ({
        ...current,
        sessionId,
        status,
        target,
        moduleIds,
        activeFrame: null,
        frames: [],
        threads: [
          {
            threadId: 'thread-0',
            name: 'bootstrap',
            status,
          },
        ],
        variables: [],
        registers: [],
        pendingCommand: null,
        activity: [`event: debug.sessionStarted (${status})`, ...current.activity].slice(0, 8),
      }));
    });

    protocol.registerHandler('debug.paused', (payload) => {
      if (!isRecord(payload) || !isRecord(payload.thread) || !isRecord(payload.frame)) {
        return;
      }

      const nextFrame: DebugFrame = {
        frameId: String(payload.frame.frameId ?? 'frame-0'),
        filePath: String(payload.frame.filePath ?? ''),
        line: Number(payload.frame.line ?? 0),
        functionName: String(payload.frame.functionName ?? ''),
      };
      const nextThread: DebugThread = {
        threadId: String(payload.thread.threadId ?? 'thread-0'),
        name: typeof payload.thread.name === 'string' ? payload.thread.name : undefined,
        status: 'paused',
        activeFrameId: nextFrame.frameId,
      };

      setDebugState((current) => ({
        ...appendActivity(current, `event: debug.paused (${nextFrame.functionName}:${nextFrame.line})`),
        status: 'paused',
        activeFrame: nextFrame,
        frames: [nextFrame],
        threads: [nextThread],
      }));
    });

    protocol.registerHandler('debug.resumed', () => {
      setDebugState((current) => ({ ...appendActivity(current, 'event: debug.resumed'), status: 'running' }));
    });

    protocol.registerHandler('debug.sessionEnded', () => {
      setDebugState((current) => ({
        ...appendActivity(current, 'event: debug.sessionEnded'),
        sessionId: null,
        status: 'stopped',
        target: null,
        moduleIds: [],
        activeFrame: null,
        frames: [],
        threads: [],
        variables: [],
        registers: [],
      }));
    });

    protocol.registerHandler('debug.callStackUpdated', (payload) => {
      if (!isRecord(payload) || !Array.isArray(payload.frames)) {
        return;
      }

      const frames = payload.frames
        .filter(isRecord)
        .map((frame) => ({
          frameId: String(frame.frameId ?? 'frame-0'),
          filePath: String(frame.filePath ?? ''),
          line: Number(frame.line ?? 0),
          functionName: String(frame.functionName ?? ''),
        }));

      setDebugState((current) => ({
        ...appendActivity(current, `event: debug.callStackUpdated (${frames[0]?.functionName ?? 'none'})`),
        frames,
        activeFrame: frames[0] ?? current.activeFrame,
      }));
    });

    protocol.registerHandler('debug.variablesUpdated', (payload) => {
      if (!isRecord(payload)) {
        return;
      }

      const variables = payload.variables;
      if (!Array.isArray(variables)) {
        return;
      }

      setDebugState((current) => ({
        ...appendActivity(current, `event: debug.variablesUpdated (${variables.length} vars)`),
        variables: variables.filter(isRecord).map((variable): DebugVariable => ({
          name: String(variable.name ?? ''),
          type: String(variable.type ?? ''),
          value: String(variable.value ?? ''),
          address: typeof variable.address === 'string' ? variable.address : undefined,
          hasChildren: Boolean(variable.hasChildren),
        })),
      }));
    });

    protocol.registerHandler('debug.registersUpdated', (payload) => {
      if (!isRecord(payload)) {
        return;
      }

      const registers = payload.registers;
      if (!Array.isArray(registers)) {
        return;
      }

      setDebugState((current) => ({
        ...appendActivity(current, `event: debug.registersUpdated (${registers.length} regs)`),
        registers: registers.filter(isRecord).map((register): DebugRegister => ({
          name: String(register.name ?? ''),
          value: String(register.value ?? ''),
          category: (register.category === 'fpu' || register.category === 'simd' ? register.category : 'gpr') as DebugRegister['category'],
          changed: Boolean(register.changed),
        })),
      }));
    });

    protocol.registerHandler('debug.breakpointHit', (payload) => {
      if (!isRecord(payload) || !isRecord(payload.breakpoint)) {
        return;
      }

      const breakpoint: DebugBreakpoint = {
        id: String(payload.breakpoint.id ?? 'breakpoint'),
        fileId: String(payload.breakpoint.fileId ?? ''),
        line: Number(payload.breakpoint.line ?? 0),
        enabled: Boolean(payload.breakpoint.enabled),
        condition: typeof payload.breakpoint.condition === 'string' ? payload.breakpoint.condition : undefined,
      };

      setDebugState((current) => ({
        ...appendActivity(current, `event: debug.breakpointHit (${breakpoint.line})`),
        status: 'paused',
        breakpoints: [...current.breakpoints.filter((entry) => entry.id !== breakpoint.id), breakpoint],
      }));
    });

    protocol.registerHandler('debug.breakpointsUpdated', (payload) => {
      if (!isRecord(payload) || !Array.isArray(payload.breakpoints)) {
        return;
      }

      const breakpoints = payload.breakpoints.filter(isRecord).map((breakpoint): DebugBreakpoint => ({
        id: String(breakpoint.id ?? 'breakpoint'),
        fileId: String(breakpoint.fileId ?? ''),
        line: Number(breakpoint.line ?? 0),
        enabled: Boolean(breakpoint.enabled),
        condition: typeof breakpoint.condition === 'string' ? breakpoint.condition : undefined,
      }));

      setDebugState((current) => ({
        ...appendActivity(current, `event: debug.breakpointsUpdated (${breakpoints.length} breakpoints)`),
        breakpoints,
      }));
    });
  }, [protocol]);

  const value = useMemo<DebugSessionContextValue>(
    () => ({
      state: debugState,
      recordCommand: (command: string) => {
        setDebugState((current) => ({
          ...current,
          pendingCommand: command,
          activity: [`command: ${command}`, ...current.activity].slice(0, 8),
        }));
      },
      toggleBreakpoint: (fileId: string, line: number) => {
        const existing = debugState.breakpoints.find((entry) => entry.fileId === fileId && entry.line === line);
        const type = existing ? 'debug.clearBreakpoint' : 'debug.setBreakpoint';

        setDebugState((current) => ({
          ...current,
          activity: [`command: ${type} (${fileId}:${line})`, ...current.activity].slice(0, 8),
        }));

        protocol.sendMessage({
          protocolVersion: '1.0.0',
          type,
          payload: {
            fileId,
            line,
          },
        });
      },
    }),
    [debugState, protocol],
  );

  return <DebugSessionContext.Provider value={value}>{children}</DebugSessionContext.Provider>;
}

export function useDebugSessionState() {
  return useContext(DebugSessionContext).state;
}

export function useDebugSession() {
  return useContext(DebugSessionContext);
}