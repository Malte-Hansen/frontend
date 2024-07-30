import ClazzCommunicationMesh from 'explorviz-frontend/view-objects/3d/application/clazz-communication-mesh';
import BaseMesh from 'explorviz-frontend/view-objects/3d/base-mesh';
import {
  EntityMesh,
  isEntityMesh,
} from 'extended-reality/utils/vr-helpers/detail-info-composer';
import { Texture, TextureLoader } from 'three';

export default class Texturer {
  private _textureCache: Map<string, Texture> = new Map();

  private loader = new TextureLoader();

  constructor() {
    // load all textures
    this.loadTexture('plus');
    this.loadTexture('minus');
    this.loadTexture('hashtag');
  }

  private loadTexture(
    texturePath: string,
    onLoad?: (texture: Texture) => void
  ) {
    const filenamePrefix = '../images/';
    const filenameSuffix = '.png';

    // use callback due to asynchronous nature
    if (this._textureCache.has(texturePath)) {
      if (onLoad) {
        onLoad(this._textureCache.get(texturePath)!);
      }
      return;
    }

    this.loader.load(
      filenamePrefix + texturePath + filenameSuffix,
      (texture) => {
        this._textureCache.set(texturePath, texture);
        if (onLoad) {
          onLoad(texture);
        }
      }
    );
  }

  applyAddedTextureToMesh(mesh: BaseMesh | undefined) {
    if (!isEntityMesh(mesh)) {
      return;
    }

    this.loadTexture('plus', (loadedTexture) => {
      if (mesh instanceof ClazzCommunicationMesh) {
        const start = mesh.layout.startPoint;
        const end = mesh.layout.endPoint;
        const dist = start.distanceTo(end);
        //mesh.wasModified = true;
        (mesh as EntityMesh).changeTexture(loadedTexture, Math.ceil(dist), 3);
      } else {
        //mesh.wasModified = true;
        mesh.changeTexture(loadedTexture);
      }
    });
  }

  applyDeletedTextureToMesh(mesh: BaseMesh | undefined) {
    if (!isEntityMesh(mesh)) {
      return;
    }

    this.loadTexture('minus', (loadedTexture) => {
      if (mesh instanceof ClazzCommunicationMesh) {
        const start = mesh.layout.startPoint;
        const end = mesh.layout.endPoint;
        const dist = start.distanceTo(end);
        //mesh.wasModified = true;
        (mesh as EntityMesh).changeTexture(loadedTexture, Math.ceil(dist), 3);
      } else {
        //mesh.wasModified = true;
        mesh.changeTexture(loadedTexture);
      }
    });
  }

  applyModifiedTextureToMesh(mesh: BaseMesh | undefined) {
    if (!isEntityMesh(mesh)) {
      return;
    }

    this.loadTexture('hashtag', (loadedTexture) => {
      if (mesh instanceof ClazzCommunicationMesh) {
        const start = mesh.layout.startPoint;
        const end = mesh.layout.endPoint;
        const dist = start.distanceTo(end);
        //mesh.wasModified = true;
        (mesh as EntityMesh).changeTexture(loadedTexture, Math.ceil(dist), 3);
      } else {
        //mesh.wasModified = true;
        mesh.changeTexture(loadedTexture);
      }
    });
  }
}
