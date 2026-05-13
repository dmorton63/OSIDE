import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';

import { useProtocol } from '../../protocol/hooks/ProtocolContext';

export type WorkspaceNode = {
  name: string;
  path: string;
  kind: 'directory' | 'file';
  children?: WorkspaceNode[];
};

export type WorkspaceState = {
  projectName: string;
  projectType: string;
  toolchainPrefix: string;
  includePaths: string[];
  modules: string[];
  rootPath: string;
  tree: WorkspaceNode[];
};

const initialWorkspaceState: WorkspaceState = {
  projectName: 'tinyos',
  projectType: 'oside.os-project',
  toolchainPrefix: 'x86_64-elf-',
  includePaths: ['include', 'modules'],
  modules: ['kernel'],
  rootPath: 'samples/tinyos',
  tree: [
    {
      name: 'src',
      path: 'samples/tinyos/src',
      kind: 'directory',
      children: [{ name: 'kernel.cpp', path: 'samples/tinyos/src/kernel.cpp', kind: 'file' }],
    },
    {
      name: 'include',
      path: 'samples/tinyos/include',
      kind: 'directory',
      children: [{ name: 'kernel.hpp', path: 'samples/tinyos/include/kernel.hpp', kind: 'file' }],
    },
    {
      name: 'modules',
      path: 'samples/tinyos/modules',
      kind: 'directory',
      children: [{ name: 'kernel.module', path: 'samples/tinyos/modules/kernel.module', kind: 'file' }],
    },
    {
      name: 'boot',
      path: 'samples/tinyos/boot',
      kind: 'directory',
      children: [{ name: 'README.md', path: 'samples/tinyos/boot/README.md', kind: 'file' }],
    },
    {
      name: 'build',
      path: 'samples/tinyos/build',
      kind: 'directory',
      children: [{ name: 'README.md', path: 'samples/tinyos/build/README.md', kind: 'file' }],
    },
    {
      name: 'scripts',
      path: 'samples/tinyos/scripts',
      kind: 'directory',
      children: [{ name: 'build.sh', path: 'samples/tinyos/scripts/build.sh', kind: 'file' }],
    },
    { name: 'project.json', path: 'samples/tinyos/project.json', kind: 'file' },
    { name: 'linker.ld', path: 'samples/tinyos/linker.ld', kind: 'file' },
  ],
};

const WorkspaceContext = createContext<WorkspaceState>(initialWorkspaceState);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function WorkspaceProvider({ children }: PropsWithChildren): ReactNode {
  const protocol = useProtocol();
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>(initialWorkspaceState);

  useEffect(() => {
    protocol.registerHandler('project.metadataLoaded', (payload) => {
      if (!isRecord(payload) || typeof payload.name !== 'string' || typeof payload.type !== 'string' || typeof payload.toolchainPrefix !== 'string') {
        return;
      }

      const projectName = payload.name;
      const projectType = payload.type;
      const toolchainPrefix = payload.toolchainPrefix;

      setWorkspaceState((current) => ({
        ...current,
        projectName,
        projectType,
        toolchainPrefix,
        includePaths: Array.isArray(payload.includePaths)
          ? payload.includePaths.filter((entry): entry is string => typeof entry === 'string')
          : current.includePaths,
        modules: Array.isArray(payload.modules) ? payload.modules.filter((entry): entry is string => typeof entry === 'string') : current.modules,
      }));
    });
  }, [protocol]);

  const value = useMemo(() => workspaceState, [workspaceState]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspaceState() {
  return useContext(WorkspaceContext);
}