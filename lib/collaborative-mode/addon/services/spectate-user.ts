import Service, { inject as service } from '@ember/service';
import CollaborationSession from 'collaborative-mode/services/collaboration-session';
import LocalUser from 'collaborative-mode/services/local-user';
import RemoteUser from 'collaborative-mode/utils/remote-user';
import debugLogger from 'ember-debug-logger';
import ToastMessage from 'explorviz-frontend/services/toast-message';
import CameraControls from 'explorviz-frontend/utils/application-rendering/camera-controls';
import VrMessageSender from 'virtual-reality/services/vr-message-sender';
import * as VrPoses from 'virtual-reality/utils/vr-helpers/vr-poses';
import { VrPose } from 'virtual-reality/utils/vr-helpers/vr-poses';
import { ForwardedMessage } from 'virtual-reality/utils/vr-message/receivable/forwarded';
import {
  UserDisconnectedMessage,
  USER_DISCONNECTED_EVENT,
} from 'virtual-reality/utils/vr-message/receivable/user_disconnect';
import {
  SpectatingUpdateMessage,
  SPECTATING_UPDATE_EVENT,
} from 'virtual-reality/utils/vr-message/sendable/spectating_update';
import WebSocketService, {
  SELF_DISCONNECTED_EVENT,
} from 'virtual-reality/services/web-socket';
import { tracked } from '@glimmer/tracking';

export default class SpectateUser extends Service {
  debug = debugLogger('spectateUserService');

  @service('local-user')
  private localUser!: LocalUser;

  @service('vr-message-sender')
  private sender!: VrMessageSender;

  @service('collaboration-session')
  collaborationSession!: CollaborationSession;

  @service('web-socket')
  private webSocket!: WebSocketService;

  @service('toast-message')
  toastMessage!: ToastMessage;

  @tracked
  spectatedUser: RemoteUser | null = null;

  cameraControls: CameraControls | null = null;

  private spectatingUsers: Set<string> = new Set<string>();

  init() {
    super.init();

    this.debug('Initializing collaboration session');
    this.webSocket.on(USER_DISCONNECTED_EVENT, this, this.onUserDisconnect);
    this.webSocket.on(SPECTATING_UPDATE_EVENT, this, this.onSpectatingUpdate);
    this.webSocket.on(SELF_DISCONNECTED_EVENT, this, this.reset);
  }

  willDestroy() {
    this.webSocket.off(USER_DISCONNECTED_EVENT, this, this.onUserDisconnect);
    this.webSocket.off(SPECTATING_UPDATE_EVENT, this, this.onSpectatingUpdate);
    this.webSocket.off(SELF_DISCONNECTED_EVENT, this, this.reset);
  }

  private reset() {
    this.spectatingUsers.clear();
    this.spectatedUser = null;
  }

  private addSpectatingUser(id: string) {
    this.spectatingUsers.add(id);
  }

  private removeSpectatingUser(id: string) {
    this.spectatingUsers.delete(id);
  }

  get isActive() {
    return this.spectatedUser !== null;
  }

  lastPose?: VrPose;

  /**
   * Used in spectating mode to set user's camera position to the spectated user's position
   */
  tick() {
    if (this.spectatedUser?.camera) {
      if (this.localUser.xr?.isPresenting) {
        this.localUser.teleportToPosition(
          this.spectatedUser.camera.model.position
        );
      } else {
        this.localUser.camera.position.copy(
          this.spectatedUser.camera.model.position
        );
        this.localUser.camera.quaternion.copy(
          this.spectatedUser.camera.model.quaternion
        );
      }
    } else if (this.spectatingUsers.size > 0) {
      const poses = VrPoses.getPoses(
        this.localUser.camera,
        this.localUser.controller1,
        this.localUser.controller2
      );
      if (JSON.stringify(this.lastPose) !== JSON.stringify(poses)) {
        this.sender.sendPoseUpdate(
          poses.camera,
          poses.controller1,
          poses.controller2
        );
      }
      this.lastPose = poses;
    }
  }

  /**
   * Switches our user into spectator mode
   * @param {number} userId The id of the user to be spectated
   */
  activate(remoteUser: RemoteUser, sendUpdate = true) {
    this.spectatedUser = remoteUser;

    if (this.localUser.controller1) {
      this.localUser.controller1.setToSpectatingAppearance();
    }
    if (this.localUser.controller2) {
      this.localUser.controller2.setToSpectatingAppearance();
    }
    if (this.cameraControls) {
      this.cameraControls.enabled = false;
    }

    remoteUser.setHmdVisible(false);
    if (sendUpdate) {
      this.sender.sendSpectatingUpdate(this.isActive, remoteUser.userId, [
        this.localUser.userId,
      ]);
    }
  }

  activateConfig(configId: string, remoteUsersIds: string[]) {
    this.sender.sendSpectatingUpdate(
      configId === 'arena-2',
      this.localUser.userId,
      remoteUsersIds,
      configId
    );
  }

  /**
   * Deactives spectator mode for our user
   */
  deactivate(sendUpdate = true) {
    if (this.cameraControls) {
      this.cameraControls.enabled = true;
    }
    if (!this.spectatedUser) return;

    if (this.localUser.controller1) {
      this.localUser.controller1.setToDefaultAppearance();
    }
    if (this.localUser.controller2) {
      this.localUser.controller2.setToDefaultAppearance();
    }

    if (sendUpdate) {
      this.sender.sendSpectatingUpdate(false, this.spectatedUser.userId, [
        this.localUser.userId,
      ]);
    }
    this.spectatedUser.setHmdVisible(true);
    this.spectatedUser = null;
  }

  private onUserDisconnect({ id }: UserDisconnectedMessage) {
    this.removeSpectatingUser(id);

    if (this.spectatedUser?.userId === id) {
      this.deactivate();
    }
  }

  /**
   * Updates the state of given user to spectating or connected.
   * Hides them if spectating.
   *
   * @param {string} userId - The user's id.
   * @param {boolean} isSpectating - True, if the user is now spectating, else false.
   */
  private onSpectatingUpdate({
    originalMessage: {
      isSpectating,
      spectatedUserId,
      spectatingUserIds,
      configuration,
    },
  }: ForwardedMessage<SpectatingUpdateMessage>): void {
    const spectatedUser =
      this.collaborationSession.getUserById(spectatedUserId);

    if (!spectatedUser) {
      this.deactivate(false);
      return;
    }

    const spectatingUsers = spectatingUserIds
      .map((userId) => this.collaborationSession.getUserById(userId))
      .filter((user) => user !== undefined) as RemoteUser[];

    this.displaySpectateMessage(spectatedUser, spectatingUsers, isSpectating);

    // Deactivate spectating if it is not spectated
    if (!isSpectating) {
      this.deactivate(false);
      spectatingUserIds.forEach((userId) => this.removeSpectatingUser(userId));
    }

    // Add spectating users if we are spectated
    if (spectatedUser instanceof LocalUser) {
      spectatingUserIds.forEach((userId) => this.addSpectatingUser(userId));
      return;
    }

    // Check if we should be spectating a user
    if (
      isSpectating &&
      spectatingUsers.some((user) => user instanceof LocalUser)
    ) {
      this.activate(spectatedUser, false);
      this.applyCameraConfiguration(configuration);
    } else {
      // Update spectatedUser's state and visibility
      spectatedUser.state = isSpectating ? 'spectating' : 'online';
      spectatedUser.setVisible(!isSpectating);
    }
  }

  displaySpectateMessage(
    spectatedUser: RemoteUser | LocalUser,
    spectatingUsers: (RemoteUser | LocalUser)[],
    isSpectating: boolean
  ) {
    const spectatedHexColor = `#${spectatedUser.color.getHexString()}`;
    let text = '';
    let spectatingUserNames = 'Nobody';

    if (spectatingUsers.length > 0) {
      spectatingUserNames = spectatingUsers
        .map((user) => user.userName)
        .reduce((usernames, username) => usernames + ', ' + username);
    }

    if (isSpectating && spectatedUser instanceof LocalUser) {
      text = 'is now spectating you';
    } else if (isSpectating) {
      text = 'is now spectating';
    } else {
      text = 'stopped spectating';
    }
    this.toastMessage.message({
      title: spectatingUserNames || 'Nobody',
      text,
      color: spectatedHexColor,
      time: 3.0,
    });
  }

  applyCameraConfiguration(
    configuration:
      | {
          deviceId: string;
          projectionMatrix: number[];
        }[]
      | null
  ) {
    // Adapt projection matrix according to spectate update
    const deviceId = new URLSearchParams(window.location.search).get(
      'deviceId'
    );
    if (configuration && deviceId) {
      const deviceConfig = configuration.find(
        (config) => config.deviceId === deviceId
      );
      if (deviceConfig) {
        this.localUser.camera.projectionMatrix.fromArray(
          deviceConfig.projectionMatrix
        );
      }
    }
  }
}

declare module '@ember/service' {
  interface Registry {
    'spectate-user': SpectateUser;
  }
}
