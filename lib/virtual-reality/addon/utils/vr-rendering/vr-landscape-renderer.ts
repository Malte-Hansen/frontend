import ElkConstructor, { ELK, ElkNode } from 'elkjs/lib/elk-api';
import { restartableTask } from 'ember-concurrency-decorators';
import debugLogger from 'ember-debug-logger';
import LandscapeRendering, { Layout1Return, Layout3Return } from 'explorviz-frontend/components/visualization/rendering/landscape-rendering';
import { LandscapeData } from 'explorviz-frontend/controllers/visualization';
import Configuration from 'explorviz-frontend/services/configuration';
import computeApplicationCommunication from 'explorviz-frontend/utils/landscape-rendering/application-communication-computer';
import * as LandscapeCommunicationRendering from 'explorviz-frontend/utils/landscape-rendering/communication-rendering';
import LandscapeLabeler from 'explorviz-frontend/utils/landscape-rendering/labeler';
import { Application, Node } from 'explorviz-frontend/utils/landscape-schemes/structure-data';
import ImageLoader from 'explorviz-frontend/utils/three-image-loader';
import ApplicationMesh from 'explorviz-frontend/view-objects/3d/landscape/application-mesh';
import LandscapeObject3D from 'explorviz-frontend/view-objects/3d/landscape/landscape-object-3d';
import NodeMesh from 'explorviz-frontend/view-objects/3d/landscape/node-mesh';
import PlaneLayout from 'explorviz-frontend/view-objects/layout-models/plane-layout';
import THREE from 'three';
import VrLandscapeObject3D from '../view-objects/landscape/vr-landscape-object-3d';
import FloorMesh from '../view-objects/vr/floor-mesh';

// Scalar with which the landscape is scaled (evenly in all dimensions)
const LANDSCAPE_SCALAR = 0.1;

// Depth of boxes for landscape entities
const LANDSCAPE_DEPTH = 0.7;

export default class VrLandscapeRenderer {
  private debug = debugLogger('VrLandscapeRenderer');

  private configuration: Configuration;
  private floor: FloorMesh;
  private font: THREE.Font;
  private landscapeData: LandscapeData;
  private elk: ELK;
  private worker: any;
  private imageLoader: ImageLoader = new ImageLoader();
  private landscapeLabeler = new LandscapeLabeler();

  readonly landscapeObject3D: LandscapeObject3D;

  constructor({ configuration, floor, font, landscapeData, worker }: {
    configuration: Configuration,
    floor: FloorMesh,
    font: THREE.Font,
    landscapeData: LandscapeData,
    worker: any
  }) {
    this.configuration = configuration;
    this.floor = floor;
    this.font = font;
    this.landscapeData = landscapeData;
    this.elk = new ElkConstructor({
      workerUrl: './assets/web-workers/elk-worker.min.js',
    });
    this.worker = worker;

    // Load and scale landscape.
    this.landscapeObject3D = new VrLandscapeObject3D(this.landscapeData.structureLandscapeData);
    this.landscapeObject3D.scale.set(LANDSCAPE_SCALAR, LANDSCAPE_SCALAR, LANDSCAPE_SCALAR);

    // Rotate landscape such that it lays flat on the floor
    this.landscapeObject3D.rotateX(-90 * THREE.MathUtils.DEG2RAD);
  }

  // #region LANDSCAPE POSITIONING

  centerLandscape() {

    // Reset scale
    this.landscapeObject3D.scale.fromArray([1,1,1]);

    // Reset landscape rotation
    this.landscapeObject3D.rotation.x = -90 * THREE.MathUtils.DEG2RAD;
    this.landscapeObject3D.rotation.y = 0;
    this.landscapeObject3D.rotation.z = 0;

    const landscape = this.landscapeObject3D;

    // Compute bounding box of the floor
    const bboxFloor = new THREE.Box3().setFromObject(this.floor);

    // Calculate center of the floor
    const centerFloor = new THREE.Vector3();
    bboxFloor.getCenter(centerFloor);

    const bboxLandscape = new THREE.Box3().setFromObject(landscape);

    // Calculate center of the landscape
    const centerLandscape = new THREE.Vector3();
    bboxLandscape.getCenter(centerLandscape);

    // Set new position of landscape
    landscape.position.x += centerFloor.x - centerLandscape.x;
    landscape.position.z += centerFloor.z - centerLandscape.z;

    // Check distance between floor and landscape
    if (bboxLandscape.min.y > bboxFloor.max.y) {
      landscape.position.y += bboxFloor.max.y - bboxLandscape.min.y + 0.001;
    }

    // Check if landscape is underneath the floor
    if (bboxLandscape.min.y < bboxFloor.min.y) {
      landscape.position.y += bboxFloor.max.y - bboxLandscape.min.y + 0.001;
    }
  }

  // #endregion LANDSCAPE POSITIONING

  // #region SCENE POPULATION

  cleanUpLandscape() {
    this.landscapeObject3D.removeAllChildren();
    this.landscapeObject3D.resetMeshReferences();
  }

  /**
   * Computes new meshes for the landscape and adds them to the scene
   *
   * @method populateLandscape
   */
  @restartableTask *
    // eslint-disable-next-line
    populateLandscape(): any {
    this.debug('populate landscape-rendering');

    const { structureLandscapeData, dynamicLandscapeData } = this.landscapeData;

    this.landscapeObject3D.dataModel = structureLandscapeData;

    // Run Klay layouting in 3 steps within workers
    try {
      const applicationCommunications = computeApplicationCommunication(structureLandscapeData,
        dynamicLandscapeData);

      // Do layout pre-processing (1st step)
      const { graph, modelIdToPoints }: Layout1Return = yield this.worker.postMessage('layout1', {
        structureLandscapeData,
        applicationCommunications,
      });

      // Run actual klay function (2nd step)
      const newGraph: ElkNode = yield this.elk.layout(graph);

      // Post-process layout graph (3rd step)
      const layoutedLandscape: any = yield this.worker.postMessage('layout3', {
        graph: newGraph,
        modelIdToPoints,
        structureLandscapeData,
        applicationCommunications,
      });

      // Clean old landscape
      this.cleanUpLandscape();

      const {
        modelIdToLayout,
        modelIdToPoints: modelIdToPointsComplete,
      }: Layout3Return = layoutedLandscape;

      const modelIdToPlaneLayout = new Map<string, PlaneLayout>();

      // Convert the simple to a PlaneLayout map
      LandscapeRendering.convertToPlaneLayoutMap(modelIdToLayout, modelIdToPlaneLayout);

      // Compute center of landscape
      const landscapeRect = this.landscapeObject3D.getMinMaxRect(modelIdToPlaneLayout);
      const centerPoint = landscapeRect.center;

      // Render all landscape entities
      const { nodes } = structureLandscapeData;

      // Draw boxes for nodes
      nodes.forEach((node: Node) => {
        this.renderNode(node, modelIdToPlaneLayout.get(node.ipAddress), centerPoint);

        const { applications } = node;

        // Draw boxes for applications
        applications.forEach((application: Application) => {
          this.renderApplication(application, modelIdToPlaneLayout.get(application.pid),
            centerPoint);
        });
      });

      // Render application communication
      const color = this.configuration.landscapeColors.communication;
      const tiles = LandscapeCommunicationRendering
        .computeCommunicationTiles(applicationCommunications, modelIdToPointsComplete,
          color, LANDSCAPE_DEPTH / 2 + 0.25);

      LandscapeCommunicationRendering.addCommunicationLineDrawing(tiles, this.landscapeObject3D,
        centerPoint, 0.004, 0.028);

      this.centerLandscape();

      this.debug('Landscape loaded');
    } catch (e) {
      this.debug(e);
    }
  }

  // #endregion SCENE POPULATION

  // #region LANDSCAPE RENDERING

  /**
   * Creates & positions a node mesh with corresponding labels.
   * Then adds it to the landscapeObject3D.
   *
   * @param node Data model for the node mesh
   * @param layout Layout data to position the mesh correctly
   * @param centerPoint Offset of landscape object
   */
  private renderNode(node: Node, layout: PlaneLayout | undefined,
    centerPoint: THREE.Vector2) {
    if (!layout) { return; }

    // Create node mesh
    const nodeMesh = new NodeMesh(
      layout,
      node,
      this.configuration.landscapeColors.node,
      this.configuration.applicationColors.highlightedEntity,
      LANDSCAPE_DEPTH,
      0.2,
    );

    // Create and add label + icon
    nodeMesh.setToDefaultPosition(centerPoint);

    // Label with own ip-address by default
    const labelText = nodeMesh.getDisplayName();

    this.landscapeLabeler.addNodeTextLabel(nodeMesh, labelText, this.font,
      this.configuration.landscapeColors.nodeText);

    // Add to scene
    this.landscapeObject3D.add(nodeMesh);
  }

  /**
   * Creates & positions an application mesh with corresponding labels.
   * Then adds it to the landscapeObject3D.
   *
   * @param application Data model for the application mesh
   * @param layout Layout data to position the mesh correctly
   * @param centerPoint Offset of landscape object
   */
  private renderApplication(application: Application, layout: PlaneLayout | undefined,
    centerPoint: THREE.Vector2) {
    if (!layout) { return; }

    // Create application mesh
    const applicationMesh = new ApplicationMesh(
      layout,
      application,
      this.configuration.landscapeColors.application,
      this.configuration.applicationColors.highlightedEntity,
      LANDSCAPE_DEPTH,
      0.3,
    );
    applicationMesh.setToDefaultPosition(centerPoint);

    // Create and add label + icon
    this.landscapeLabeler.addApplicationTextLabel(applicationMesh, application.name, this.font,
      this.configuration.landscapeColors.applicationText);
    LandscapeLabeler.addApplicationLogo(applicationMesh, this.imageLoader);

    // Add to scene
    this.landscapeObject3D.add(applicationMesh);
  }

  // #endregion LANDSCAPE RENDERING
}
