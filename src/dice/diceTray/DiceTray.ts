import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { PhysicsImpostor } from "@babylonjs/core/Physics/physicsImpostor";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { AbstractMesh, Scene, ShadowGenerator } from "@babylonjs/core";

import singleMeshSource from "./single.glb";
import doubleMeshSource from "./double.glb";

import singleAlbedo from "./singleAlbedo.jpg";
import singleMetalRoughness from "./singleMetalRoughness.jpg";
import singleNormal from "./singleNormal.jpg";

import doubleAlbedo from "./doubleAlbedo.jpg";
import doubleMetalRoughness from "./doubleMetalRoughness.jpg";
import doubleNormal from "./doubleNormal.jpg";

import { importTextureAsync } from "../../helpers/babylon";

class DiceTray {
  _size;

  get size() {
    return this._size;
  }

  set size(newSize) {
    this._size = newSize;
    const wallOffsetWidth = this.collisionSize / 2 + this.width / 2 - 0.5;
    const wallOffsetHeight = this.collisionSize / 2 + this.height / 2 - 0.5;
    if (this.wallTop) this.wallTop.position.z = -wallOffsetHeight;
    if (this.wallRight) this.wallRight.position.x = -wallOffsetWidth;
    if (this.wallBottom) this.wallBottom.position.z = wallOffsetHeight;
    if (this.wallLeft) this.wallLeft.position.x = wallOffsetWidth;
    if (this.singleMesh) this.singleMesh.isVisible = newSize === "single";
    if (this.doubleMesh) this.doubleMesh.isVisible = newSize === "double";
  }

  scene;
  shadowGenerator;

  get width() {
    return this.size === "single" ? 10 : 20;
  }

  height = 20;
  collisionSize = 50;
  wallTop?: Mesh;
  wallRight?: Mesh;
  wallBottom?: Mesh;
  wallLeft?: Mesh;
  singleMesh?: AbstractMesh;
  doubleMesh?: AbstractMesh;

  constructor(
    initialSize: string,
    scene: Scene,
    shadowGenerator: ShadowGenerator
  ) {
    this._size = initialSize;
    this.scene = scene;
    this.shadowGenerator = shadowGenerator;
  }

  async load() {
    this.loadWalls();
    await this.loadMeshes();
  }

  createCollision(
    name: string,
    x: number,
    y: number,
    z: number,
    friction: number
  ): Mesh {
    let collision = Mesh.CreateBox(
      name,
      this.collisionSize,
      this.scene,
      true,
      Mesh.DOUBLESIDE
    );
    collision.position.x = x;
    collision.position.y = y;
    collision.position.z = z;
    collision.physicsImpostor = new PhysicsImpostor(
      collision,
      PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: friction },
      this.scene
    );
    collision.isVisible = false;

    return collision;
  }

  loadWalls() {
    const wallOffsetWidth = this.collisionSize / 2 + this.width / 2 - 0.5;
    const wallOffsetHeight = this.collisionSize / 2 + this.height / 2 - 0.5;
    this.wallTop = this.createCollision("wallTop", 0, 0, -wallOffsetHeight, 10);
    this.wallRight = this.createCollision(
      "wallRight",
      -wallOffsetWidth,
      0,
      0,
      10
    );
    this.wallBottom = this.createCollision(
      "wallBottom",
      0,
      0,
      wallOffsetHeight,
      10
    );
    this.wallLeft = this.createCollision("wallLeft", wallOffsetWidth, 0, 0, 10);
    const diceTrayGroundOffset = 0.32;
    this.createCollision(
      "ground",
      0,
      -this.collisionSize / 2 + diceTrayGroundOffset,
      0,
      20
    );
    const diceTrayRoofOffset = 10;
    this.createCollision(
      "roof",
      0,
      this.collisionSize / 2 + diceTrayRoofOffset,
      0,
      100
    );
  }

  async loadMeshes() {
    let [
      singleMeshes,
      doubleMeshes,
      singleAlbedoTexture,
      singleNormalTexture,
      singleMetalRoughnessTexture,
      doubleAlbedoTexture,
      doubleNormalTexture,
      doubleMetalRoughnessTexture,
    ] = await Promise.all([
      SceneLoader.ImportMeshAsync("", singleMeshSource, "", this.scene),
      SceneLoader.ImportMeshAsync("", doubleMeshSource, "", this.scene),
      importTextureAsync(singleAlbedo),
      importTextureAsync(singleNormal),
      importTextureAsync(singleMetalRoughness),
      importTextureAsync(doubleAlbedo),
      importTextureAsync(doubleNormal),
      importTextureAsync(doubleMetalRoughness),
    ]);

    this.singleMesh = singleMeshes.meshes[1];
    this.singleMesh.id = "dice_tray_single";
    this.singleMesh.name = "dice_tray";
    let singleMaterial = new PBRMaterial("dice_tray_mat_single", this.scene);
    singleMaterial.albedoTexture = singleAlbedoTexture;
    singleMaterial.bumpTexture = singleNormalTexture;
    singleMaterial.metallicTexture = singleMetalRoughnessTexture;
    singleMaterial.useRoughnessFromMetallicTextureAlpha = false;
    singleMaterial.useRoughnessFromMetallicTextureGreen = true;
    singleMaterial.useMetallnessFromMetallicTextureBlue = true;
    this.singleMesh.material = singleMaterial;

    this.singleMesh.receiveShadows = true;
    this.shadowGenerator.addShadowCaster(this.singleMesh);
    this.singleMesh.isVisible = this.size === "single";

    this.doubleMesh = doubleMeshes.meshes[1];
    this.doubleMesh.id = "dice_tray_double";
    this.doubleMesh.name = "dice_tray";
    let doubleMaterial = new PBRMaterial("dice_tray_mat_double", this.scene);
    doubleMaterial.albedoTexture = doubleAlbedoTexture;
    doubleMaterial.bumpTexture = doubleNormalTexture;
    doubleMaterial.metallicTexture = doubleMetalRoughnessTexture;
    doubleMaterial.useRoughnessFromMetallicTextureAlpha = false;
    doubleMaterial.useRoughnessFromMetallicTextureGreen = true;
    doubleMaterial.useMetallnessFromMetallicTextureBlue = true;
    this.doubleMesh.material = doubleMaterial;

    this.doubleMesh.receiveShadows = true;
    this.shadowGenerator.addShadowCaster(this.doubleMesh);
    this.doubleMesh.isVisible = this.size === "double";
  }
}

export default DiceTray;
