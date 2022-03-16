import Service, { inject as service } from '@ember/service';
import debugLogger from 'ember-debug-logger';
import WebSocketService from 'virtual-reality/services/web-socket';
import { isMousePingUpdateMessage, MousePingUpdateMessage } from 'virtual-reality/utils/vr-message/sendable/mouse-ping-update';
import { isPingUpdateMessage, PingUpdateMessage } from 'virtual-reality/utils/vr-message/sendable/ping_update';
import { isTimestampUpdateMessage, TimestampUpdateMessage } from 'virtual-reality/utils/vr-message/sendable/timetsamp_update';
import { ForwardedMessage, isForwardedMessage, isForwardedMessageOf } from '../utils/vr-message/receivable/forwarded';
import { InitialLandscapeMessage, isInitialLandscapeMessage } from '../utils/vr-message/receivable/landscape';
import { isMenuDetachedForwardMessage, MenuDetachedForwardMessage } from '../utils/vr-message/receivable/menu-detached-forward';
import { isResponseMessage, ResponseMessage } from '../utils/vr-message/receivable/response';
import { isSelfConnectedMessage, SelfConnectedMessage } from '../utils/vr-message/receivable/self_connected';
import { isUserConnectedMessage, UserConnectedMessage } from '../utils/vr-message/receivable/user_connected';
import { isUserDisconnectedMessage, UserDisconnectedMessage } from '../utils/vr-message/receivable/user_disconnect';
import { AppOpenedMessage, isAppOpenedMessage } from '../utils/vr-message/sendable/app_opened';
import { ComponentUpdateMessage, isComponentUpdateMessage } from '../utils/vr-message/sendable/component_update';
import { HighlightingUpdateMessage, isHighlightingUpdateMessage } from '../utils/vr-message/sendable/highlighting_update';
import { isObjectMovedMessage, ObjectMovedMessage } from '../utils/vr-message/sendable/object_moved';
import { AppClosedMessage, isAppClosedMessage } from '../utils/vr-message/sendable/request/app_closed';
import { DetachedMenuClosedMessage, isDetachedMenuClosedMessage } from '../utils/vr-message/sendable/request/detached_menu_closed';
import { isSpectatingUpdateMessage, SpectatingUpdateMessage } from '../utils/vr-message/sendable/spectating_update';
import { isUserControllerConnectMessage, UserControllerConnectMessage } from '../utils/vr-message/sendable/user_controller_connect';
import { isUserControllerDisconnectMessage, UserControllerDisconnectMessage } from '../utils/vr-message/sendable/user_controller_disconnect';
import { isUserPositionsMessage, UserPositionsMessage } from '../utils/vr-message/sendable/user_positions';
import { Nonce } from '../utils/vr-message/util/nonce';

type ResponseHandler<T> = (msg: T) => void;

export interface VrMessageListener {
  onSelfConnected(msg: SelfConnectedMessage): void;
  onUserConnected(msg: UserConnectedMessage): void;
  onUserDisconnect(msg: UserDisconnectedMessage): void;
  onInitialLandscape(msg: InitialLandscapeMessage): void;
  onMenuDetached(msg: MenuDetachedForwardMessage): void;

  // Forwarded messages.
  onUserPositions(msg: ForwardedMessage<UserPositionsMessage>): void;
  onUserControllerConnect(
    msg: ForwardedMessage<UserControllerConnectMessage>
  ): void;
  onUserControllerDisconnect(
    msg: ForwardedMessage<UserControllerDisconnectMessage>
  ): void;
  onAppOpened(msg: ForwardedMessage<AppOpenedMessage>): void;
  onAppClosed(msg: ForwardedMessage<AppClosedMessage>): void;
  onDetachedMenuClosed(msg: ForwardedMessage<DetachedMenuClosedMessage>): void;
  onPingUpdate(msg: ForwardedMessage<PingUpdateMessage>): void;
  onMousePingUpdate(msg: ForwardedMessage<MousePingUpdateMessage>): void;
  onTimestampUpdate(msg: ForwardedMessage<TimestampUpdateMessage>): void;
  onObjectMoved(msg: ForwardedMessage<ObjectMovedMessage>): void;
  onComponentUpdate(msg: ForwardedMessage<ComponentUpdateMessage>): void;
  onHighlightingUpdate(msg: ForwardedMessage<HighlightingUpdateMessage>): void;
  onSpectatingUpdate(msg: ForwardedMessage<SpectatingUpdateMessage>): void;
}

// TODO should I add this.
export interface CollaborationSessionMessageListener {
  onSelfConnected(msg: SelfConnectedMessage): void;
  onUserConnected(msg: UserConnectedMessage): void;
  onUserDisconnect(msg: UserDisconnectedMessage): void;
  onInitialLandscape(msg: InitialLandscapeMessage): void;

  onTimestampUpdate(msg: ForwardedMessage<TimestampUpdateMessage>): void;
  // onSpectatingUpdate(msg: ForwardedMessage<SpectatingUpdateMessage>): void;
}

export default class VrMessageReceiver extends Service {
  private debug = debugLogger('VrMessageReceiver');

  @service('web-socket')
  private webSocket!: WebSocketService;

  private responseHandlers = new Map<Nonce, ResponseHandler<any>>();

  init() {
    super.init();
    // this.webSocket.messageCallback = (msg) => this.onMessage(msg);
  }

  private onResponseMessage(msg: ResponseMessage<any>) {
    const handler = this.responseHandlers.get(msg.nonce);
    if (handler) handler(msg.response);
  }

  /**
   * Adds an event listener that is invoked when a response with the given
   * identifier is received.
   *
   * When the response is received, the listener is removed.
   *
   * If the user is offline, no listener will be created.
   *
   * @param nonce Locally unique identifier of the request whose response to wait for.
   * @param responseType A type guard that tests whether the received response has the correct type.
   * @param onResponse The callback to invoke when the response is received.
   * @param onOnline The callback to invoke before staring to listen for responses when the client
   * is connected.
   * @param onOffline The callback to invoke instead of listening for responses when the client is
   * not connected.
   */
  awaitResponse<T>({
    nonce,
    responseType: isValidResponse,
    onResponse,
    onOnline,
    onOffline,
  }: {
    nonce: Nonce;
    responseType: (msg: any) => msg is T;
    onResponse: ResponseHandler<T>;
    onOnline?: () => void;
    onOffline?: () => void;
  }) {
    // Don't wait for response unless there is a open websocket connection.
    if (!this.webSocket.isWebSocketOpen()) {
      if (onOffline) onOffline();
      return;
    }

    // If a websocket connection is open, notify callee that the listener is added.
    if (onOnline) onOnline();

    // Listen for responses.
    const handler = (response: any) => {
      if (isValidResponse(response)) {
        this.responseHandlers.delete(nonce);
        onResponse(response);
      } else {
        this.debug('Received invalid response', response);
      }
    };
    this.responseHandlers.set(nonce, handler);
  }
}

declare module '@ember/service' {
  interface Registry {
    'vr-message-receiver': VrMessageReceiver;
  }
}
