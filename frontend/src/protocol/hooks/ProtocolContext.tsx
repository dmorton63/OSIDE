import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { WebSocketClient } from '../client/WebSocketClient';
import { MessageRouter } from '../router/MessageRouter';

export type ProtocolConnectionState = 'connecting' | 'connected' | 'disconnected';

type ProtocolContextValue = {
  connectionState: ProtocolConnectionState;
  lastMessageType: string | null;
  registerHandler: (type: string, handler: (payload: unknown) => void) => void;
  sendMessage: (message: unknown) => void;
};

const ProtocolContext = createContext<ProtocolContextValue>({
  connectionState: 'disconnected',
  lastMessageType: null,
  registerHandler: () => {},
  sendMessage: () => {},
});

function getProtocolWebSocketUrl() {
  const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${scheme}://${window.location.host}/ws`;
}

export function ProtocolProvider({ children }: PropsWithChildren) {
  const routerRef = useRef(new MessageRouter());
  const clientRef = useRef<WebSocketClient | null>(null);
  const [connectionState, setConnectionState] = useState<ProtocolConnectionState>('connecting');
  const [lastMessageType, setLastMessageType] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const router = routerRef.current;
    const client = new WebSocketClient(
      getProtocolWebSocketUrl(),
      (message) => {
        if (!isActive) {
          return;
        }

        if (typeof message === 'object' && message !== null && 'type' in message) {
          const routedMessage = message as { type: string; payload: unknown };
          setLastMessageType(routedMessage.type);
          router.route(routedMessage);
        }
      },
      {
        onOpen: () => {
          if (isActive) {
            setConnectionState('connected');
          }
        },
        onClose: () => {
          if (isActive) {
            setConnectionState('disconnected');
          }
        },
        onError: () => {
          if (isActive) {
            setConnectionState('disconnected');
          }
        },
      },
    );

    clientRef.current = client;
    setConnectionState('connecting');
    client.connect();

    return () => {
      isActive = false;
      client.disconnect();
      clientRef.current = null;
      setConnectionState('disconnected');
    };
  }, []);

  return (
    <ProtocolContext.Provider
      value={{
        connectionState,
        lastMessageType,
        registerHandler: (type, handler) => routerRef.current.register(type, handler),
        sendMessage: (message) => clientRef.current?.send(message),
      }}
    >
      {children}
    </ProtocolContext.Provider>
  );
}

export function useProtocol() {
  return useContext(ProtocolContext);
}