import type { PropsWithChildren } from 'react';

import { BuildOutputProvider } from '../build/state/BuildOutputContext';
import { DebugSessionProvider } from '../debug/session/DebugSessionContext';
import { ProtocolProvider } from '../protocol/hooks/ProtocolContext';
import { WorkspaceProvider } from '../workspace/state/WorkspaceContext';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ProtocolProvider>
      <DebugSessionProvider>
        <BuildOutputProvider>
          <WorkspaceProvider>{children}</WorkspaceProvider>
        </BuildOutputProvider>
      </DebugSessionProvider>
    </ProtocolProvider>
  );
}
