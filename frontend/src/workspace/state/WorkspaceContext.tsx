import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
  activeFilePath: string | null;
  openFilePaths: string[];
  fileContents: Record<string, string>;
};

type WorkspaceContextValue = {
  state: WorkspaceState;
  loadProject: (rootPath: string) => void;
  openFile: (filePath: string) => void;
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
  activeFilePath: 'samples/tinyos/src/kernel.cpp',
  openFilePaths: ['samples/tinyos/src/kernel.cpp'],
  fileContents: {},
};

const WorkspaceContext = createContext<WorkspaceContextValue>({
  state: initialWorkspaceState,
  loadProject: () => {},
  openFile: () => {},
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeWorkspacePath(path: string, rootPath: string): string {
  if (path.startsWith(`${rootPath}/`)) {
    return path.slice(rootPath.length + 1);
  }

  return path;
}

function findFirstFile(nodes: WorkspaceNode[]): string | null {
  for (const node of nodes) {
    if (node.kind === 'file') {
      return node.path;
    }

    if (node.children) {
      const candidate = findFirstFile(node.children);
      if (candidate) {
        return candidate;
      }
    }
  }

  return null;
}

export function WorkspaceProvider({ children }: PropsWithChildren): ReactNode {
  const protocol = useProtocol();
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>(initialWorkspaceState);
  const rootPathRef = useRef(initialWorkspaceState.rootPath);

  const loadProject = (rootPath: string) => {
    rootPathRef.current = rootPath;
    protocol.sendMessage({
      protocolVersion: '1.0.0',
      type: 'project.loadMetadata',
      payload: {
        rootPath,
      },
    });
  };

  const openFile = (filePath: string) => {
    const normalizedFilePath = normalizeWorkspacePath(filePath, rootPathRef.current);

    setWorkspaceState((current) => ({
      ...current,
      activeFilePath: normalizedFilePath,
      openFilePaths: current.openFilePaths.includes(normalizedFilePath)
        ? current.openFilePaths
        : [...current.openFilePaths, normalizedFilePath],
    }));

    protocol.sendMessage({
      protocolVersion: '1.0.0',
      type: 'project.readFile',
      payload: {
        rootPath: rootPathRef.current,
        filePath: normalizedFilePath,
      },
    });
  };

  useEffect(() => {
    if (protocol.connectionState === 'connected') {
      loadProject(workspaceState.rootPath);
    }
  }, [protocol.connectionState]);

  useEffect(() => {
    protocol.registerHandler('project.metadataLoaded', (payload) => {
      if (!isRecord(payload) || typeof payload.name !== 'string' || typeof payload.type !== 'string' || typeof payload.toolchainPrefix !== 'string') {
        return;
      }

      const projectName = payload.name;
      const projectType = payload.type;
      const toolchainPrefix = payload.toolchainPrefix;

      const parseTreeNode = (node: unknown): WorkspaceNode | null => {
        if (!isRecord(node) || typeof node.name !== 'string' || typeof node.path !== 'string' || (node.kind !== 'directory' && node.kind !== 'file')) {
          return null;
        }

        const children = Array.isArray(node.children)
          ? node.children.map(parseTreeNode).filter((entry): entry is WorkspaceNode => entry !== null)
          : undefined;

        return {
          name: node.name,
          path: node.path,
          kind: node.kind,
          children,
        };
      };

      const tree = Array.isArray(payload.tree)
        ? payload.tree.map(parseTreeNode).filter((entry): entry is WorkspaceNode => entry !== null)
        : undefined;
      const nextRootPath = typeof payload.rootPath === 'string' ? payload.rootPath : rootPathRef.current;
      const firstFilePath = tree ? findFirstFile(tree) : null;

      rootPathRef.current = nextRootPath;

      setWorkspaceState((current) => ({
        ...current,
        projectName,
        projectType,
        toolchainPrefix,
        rootPath: nextRootPath,
        includePaths: Array.isArray(payload.includePaths)
          ? payload.includePaths.filter((entry): entry is string => typeof entry === 'string')
          : current.includePaths,
        modules: Array.isArray(payload.modules) ? payload.modules.filter((entry): entry is string => typeof entry === 'string') : current.modules,
        tree: tree ?? current.tree,
        activeFilePath: firstFilePath ?? current.activeFilePath,
        openFilePaths: firstFilePath ? [firstFilePath] : current.openFilePaths,
        fileContents: firstFilePath && current.activeFilePath !== firstFilePath ? {} : current.fileContents,
      }));

      if (firstFilePath) {
        protocol.sendMessage({
          protocolVersion: '1.0.0',
          type: 'project.readFile',
          payload: {
            rootPath: nextRootPath,
            filePath: firstFilePath,
          },
        });
      }
    });

    protocol.registerHandler('project.fileLoaded', (payload) => {
      if (!isRecord(payload) || typeof payload.filePath !== 'string' || typeof payload.content !== 'string') {
        return;
      }

      const filePath = payload.filePath;
      const content = payload.content;

      setWorkspaceState((current) => ({
        ...current,
        activeFilePath: current.activeFilePath ?? filePath,
        openFilePaths: current.openFilePaths.includes(filePath)
          ? current.openFilePaths
          : [...current.openFilePaths, filePath],
        fileContents: {
          ...current.fileContents,
          [filePath]: content,
        },
      }));
    });
  }, [protocol]);

  const value = useMemo<WorkspaceContextValue>(() => ({ state: workspaceState, loadProject, openFile }), [workspaceState, loadProject, openFile]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspaceState() {
  return useContext(WorkspaceContext).state;
}

export function useWorkspaceActions() {
  const context = useContext(WorkspaceContext);
  return { loadProject: context.loadProject, openFile: context.openFile };
}