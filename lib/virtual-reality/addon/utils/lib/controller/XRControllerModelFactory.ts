/**
 * Adapted from: https://github.com/mrdoob/three.js/blob/master/examples/jsm/webxr/XRControllerModelFactory.js
 */

import {
  Mesh,
  MeshBasicMaterial,
  Object3D,
  SphereBufferGeometry,
  Scene,
} from 'three';

import debugLogger from 'ember-debug-logger';
import { GLTFLoader } from '../loader/GLTFLoader';

import {
  Constants as MotionControllerConstants,
  fetchProfile,
  MotionController,
} from './motion-controllers.module';
import XRControllerModel from './XRControllerModel';
import VisualResponse from './VisualResponse';

const DEFAULT_PROFILES_PATH = 'https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles';
const DEFAULT_PROFILE = 'generic-trigger';

export default class XRControllerModelFactory {
  static INSTANCE = new XRControllerModelFactory();

  debug = debugLogger('XRControllerModelFactory');

  gltfLoader: any;

  path: string;

  assetSceneCache: { [key: string]: Promise<THREE.Scene> };

  constructor(gltfLoader = null) {
    this.gltfLoader = gltfLoader || new GLTFLoader();
    this.path = DEFAULT_PROFILES_PATH;
    this.assetSceneCache = {};
  }

  /**
 * Walks the model's tree to find the nodes needed to animate the components and
 * saves them to the motionContoller components for use in the frame loop. When
 * touchpads are found, attaches a touch dot to them.
 */
  static findNodes(motionController: MotionController, scene: Scene) {
    const debug = debugLogger('XRControllerModelFactory.findNodes()');
    debug('Test');
    // Loop through the components and find the nodes needed for each components' visual responses
    Object.values(motionController.components).forEach((component: any) => {
      const { type, touchPointNodeName, visualResponses } = component;

      if (type === MotionControllerConstants.ComponentType.TOUCHPAD) {
        component.touchPointNode = scene.getObjectByName(touchPointNodeName);
        if (component.touchPointNode) {
        // Attach a touch dot to the touchpad.
          const sphereGeometry = new SphereBufferGeometry(0.001);
          const material = new MeshBasicMaterial({ color: 0x0000FF });
          const sphere = new Mesh(sphereGeometry, material);
          component.touchPointNode.add(sphere);
        } else {
          debug(`Could not find touch dot, ${component.touchPointNodeName}, in touchpad component ${component.id}`);
        }
      }

      // Loop through all the visual responses to be applied to this component
      Object.values(visualResponses).forEach((visualResponse: VisualResponse) => {
        const {
          valueNodeName, minNodeName, maxNodeName, valueNodeProperty,
        } = visualResponse;

        // If animating a transform, find the two nodes to be interpolated between.
        if (minNodeName && maxNodeName
          && valueNodeProperty === MotionControllerConstants.VisualResponseProperty.TRANSFORM) {
          visualResponse.minNode = scene.getObjectByName(minNodeName);
          visualResponse.maxNode = scene.getObjectByName(maxNodeName);

          // If the extents cannot be found, skip this animation
          if (!visualResponse.minNode) {
            debug(`Could not find ${minNodeName} in the model`);
            return;
          }

          if (!visualResponse.maxNode) {
            debug(`Could not find ${maxNodeName} in the model`);
            return;
          }
        }

        // If the target node cannot be found, skip this animation
        visualResponse.valueNode = scene.getObjectByName(valueNodeName);
        if (!visualResponse.valueNode) {
          debug(`Could not find ${valueNodeName} in the model`);
        }
      });
    });
  }

  static addAssetSceneToControllerModel(controllerModel: XRControllerModel, scene: Scene|null) {
    if (!controllerModel.motionController || !scene) return;

    // Find the nodes needed for animation and cache them on the motionController.
    XRControllerModelFactory.findNodes(controllerModel.motionController, scene);

    // Apply any environment map that the mesh already has set.
    if (controllerModel.envMap) {
      scene.traverse((child: Object3D) => {
        if (child instanceof Mesh) {
          child.material.envMap = controllerModel.envMap;
          child.material.needsUpdate = true;
        }
      });
    }

    // Add the glTF scene to the controllerModel.
    controllerModel.add(scene);
  }

  createControllerModel(controller: THREE.Group) {
    const controllerModel = new XRControllerModel();
    let lastAssetScene: THREE.Scene|null = null;

    controller.addEventListener('connected', async (event) => {
      try {
        const xrInputSource = event.data;
        if (xrInputSource.targetRayMode !== 'tracked-pointer' || !xrInputSource.gamepad) return;

        let {profile, assetPath} = await fetchProfile(xrInputSource, this.path, DEFAULT_PROFILE);
        controllerModel.onMotionControllerConnect(new MotionController(
          xrInputSource,
          profile,
          assetPath,
        ));

        this.loadAssetScene(assetPath).then((assetScene) => {
          XRControllerModelFactory.addAssetSceneToControllerModel(controllerModel, assetScene);
          lastAssetScene = assetScene;
        });
      } catch (err) {
        this.debug(err);
      }
    });

    controller.addEventListener('disconnected', () => {
      controllerModel.onMotionControllerDisconnect();
      if (lastAssetScene) controllerModel.remove(lastAssetScene);
      lastAssetScene = null;
    });

    return controllerModel;
  }

  async loadAssetScene(assetUrl: string): Promise<THREE.Scene> {
    if (!this.assetSceneCache[assetUrl]) {
      this.assetSceneCache[assetUrl] = new Promise((resolve, reject) => {
        this.gltfLoader.setPath('');
        this.gltfLoader.load(assetUrl, (asset: any) => {
          resolve(asset.scene);
        },
        null,
        () => reject(`Failed to load asset from ${assetUrl}`));
      });
    }
    let cachedAsset = await this.assetSceneCache[assetUrl];
    return cachedAsset.clone();
  }
}
