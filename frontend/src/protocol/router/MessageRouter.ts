export type RoutedMessage = { type: string; payload: unknown };
export type MessageHandler = (payload: unknown) => void;

export class MessageRouter {
  private readonly handlers = new Map<string, MessageHandler>();

  register(type: string, handler: MessageHandler) {
    this.handlers.set(type, handler);
  }

  route(message: RoutedMessage) {
    const handler = this.handlers.get(message.type);
    if (!handler) {
      return false;
    }

    handler(message.payload);
    return true;
  }
}
