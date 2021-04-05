import Service, { inject as service } from '@ember/service';
import ENV from 'explorviz-frontend/config/environment';
import debugLogger from 'ember-debug-logger';

const { vrService } = ENV.backendAddresses;

export default class WebSocketService extends Service {
  @service()
  private websockets !: any;

  private debug = debugLogger('WebSocketService');

  private currentSocket: any = null; // WebSocket to send/receive messages to/from backend
  private currentSocketUrl: string | null = null;

  socketCloseCallback: ((event: any) => void) | null = null;
  messageCallback: ((message: any) => void) | null = null;

  private getSocketUrl(ticketId: string) {
    const vrServiceSocket = vrService.replace(/^http(s?):\/\//i, 'ws$1://');
    return `${vrServiceSocket}/v2/vr/${ticketId}`;
  }

  async initSocket(ticketId: string) {
    this.currentSocketUrl = this.getSocketUrl(ticketId);
    this.currentSocket = this.websockets.socketFor(this.currentSocketUrl);
    this.currentSocket.on('message', this.messageHandler, this);
    this.currentSocket.on('close', this.closeHandler, this);
  }

  closeSocket() {
    if (this.currentSocketUrl) this.websockets.closeSocketFor(this.currentSocketUrl);
  }

  private closeHandler(event: any) {
    // Log that connection has been closed.
    if (event && event.code && event.target.url) {
      this.debug(`Connection to Backend-Extension ( ${event.target.url} ) closed, WebSocket close code ${event.code}.`);
    }

    // Invoke external event listener for close event.
    if (this.socketCloseCallback) {
      this.socketCloseCallback(event);
    }

    // Remove internal event listeners.
    this.currentSocket.off('message', this.messageHandler);
    this.currentSocket.off('close', this.closeHandler);
    this.currentSocket = null;
    this.currentSocketUrl = null;
  }

  private messageHandler(event: any) {
    const message = JSON.parse(event.data);
    if (this.messageCallback) {
      this.messageCallback(message);
    }
  }

  /**
   * Sends a message to the backend.
   *
   * The type parameter `T` is used to validate the type of the sent message
   * at compile time.
   *
   * @param msg The message to send.
   */
  send<T>(msg: T) {
    if (this.isWebSocketOpen()) this.currentSocket.send(JSON.stringify(msg));
  }

  isWebSocketOpen() {
    return this.currentSocket && this.currentSocket.readyState() === 1;
  }

  reset() {
    this.currentSocket = null;
    this.currentSocketUrl = null;
  }
}

declare module '@ember/service' {
  interface Registry {
    'web-socket': WebSocketService;
  }
}
