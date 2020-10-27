import Service, { inject as service } from '@ember/service';
import debugLogger from 'ember-debug-logger';

export default class WebSocket extends Service.extend({
  // anything which *must* be merged to prototype here
}) {
  @service()
  websockets !: any;

  debug = debugLogger('VrMultiUser');

  private socketRef: any; // WebSocket to send/receive messages to/from backend

  private updateQueue: any[] = []; // Messages which are ready to be sent to backend

  host: string|null = '';

  port: string|null = '';

  socketCloseCallback: ((event: any) => void)| null = null;

  eventCallback: ((event: any, data: any) => void)| null = null;

  initSocket() {
    const socket = this.websockets.socketFor(`ws://${this.host}:${this.port}/`);
    socket.on('message', this.messageHandler, this);
    socket.on('close', this.closeHandler, this);
    this.socketRef = socket;
  }

  applyConfiguration(config: { host: string, port: string }) {
    this.host = config.host;
    this.port = config.port;
  }

  closeSocket() {
    this.websockets.closeSocketFor(`ws://${this.get('host')}:${this.get('port')}/`);
    // Close handlers
    const socket = this.get('_socketRef');
    if (socket) {
      socket.off('message', this.messageHandler);
      socket.off('close', this.closeHandler);
    }
    this.socketRef = null;
    this.updateQueue = [];
  }

  private closeHandler(event: any) {
    if (event && event.code && event.target.url) {
      this.debug(`Connection to Backend-Extension ( ${event.target.url} ) closed, WebSocket close code ${event.code}.`);
    }
    if (this.socketCloseCallback) {
      this.socketCloseCallback(event);
    }
  }

  private messageHandler(event: any) {
    // Backend could have sent multiple messages at a time
    const messages = JSON.parse(event.data);
    for (let i = 0; i < messages.length; i++) {
      const data = messages[i];
      if (this.eventCallback) {
        this.eventCallback(data.event, data);
      }
    }
  }

  // Used to send messages to the backend
  send(obj: any) {
    if (this.socketRef) { this.socketRef.send(JSON.stringify(obj)); }
  }

  sendDisconnectRequest() {
    const disconnectMessage = [{
      event: 'receive_disconnect_request',
    }];
    this.send(disconnectMessage);
  }

  /**
   * Check wether there are messages in the update queue and send them to the backend.
   */
  sendUpdates() {
    // there are updates to send
    if (this.updateQueue && this.updateQueue.length > 0) {
      this.send(this.updateQueue);
      this.updateQueue = [];
    }
  }

  enqueueIfOpen(JSONObj: any) {
    if (!this.isWebSocketOpen()) { return; }

    if (this.updateQueue) {
      this.updateQueue.push(JSONObj);
    }
  }

  isWebSocketOpen() {
    return this.socketRef && this.socketRef.readyState() === 1;
  }

  reset() {
    this.socketRef = null;
    this.updateQueue = [];
    this.host = null;
    this.port = null;
  }
}

declare module '@ember/service' {
  interface Registry {
    'web-socket': WebSocket;
  }
}
