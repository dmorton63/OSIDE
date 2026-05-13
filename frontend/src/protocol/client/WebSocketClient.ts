export type MessageHandler = (message: unknown) => void;

export type ConnectionLifecycle = {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: () => void;
};

export class WebSocketClient {
  private socket: WebSocket | null = null;

  constructor(
    private readonly url: string,
    private readonly onMessage: MessageHandler,
    private readonly lifecycle: ConnectionLifecycle = {},
  ) {}

  connect() {
    if (this.socket) {
      return;
    }

    this.socket = new WebSocket(this.url);
    this.socket.addEventListener('open', () => {
      this.lifecycle.onOpen?.();
    });
    this.socket.addEventListener('close', () => {
      this.lifecycle.onClose?.();
    });
    this.socket.addEventListener('error', () => {
      this.lifecycle.onError?.();
    });
    this.socket.addEventListener('message', (event) => {
      try {
        this.onMessage(JSON.parse(event.data));
      } catch {
        this.onMessage(event.data);
      }
    });
  }

  disconnect() {
    this.socket?.close();
    this.socket = null;
  }

  send(message: unknown) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    this.socket.send(JSON.stringify(message));
  }
}
