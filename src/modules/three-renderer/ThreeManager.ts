/**
 * @module three-renderer/ThreeManager
 * Singleton managing the Three.js WebGL canvas and progressive step rendering.
 */

import * as THREE from 'three';
import type { ThreePrimitive } from './primitive-types';
import { buildStepGroupFromPrimitives } from './ThreeStepBuilder';
import { fadeDurationMs } from './ThreeStepAnimator';

let instance: ThreeManager | null = null;

export class ThreeManager {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private width = 800;
  private height = 600;
  private stepGroups: THREE.Group[] = [];
  private stepIds: string[] = [];
  private ambientLight: THREE.AmbientLight | null = null;
  private dirLight: THREE.DirectionalLight | null = null;
  private rafId: number | null = null;

  static getInstance(): ThreeManager {
    if (!instance) {
      instance = new ThreeManager();
    }
    return instance;
  }

  static resetInstance(): void {
    instance?.destroy();
    instance = null;
  }

  attach(view: HTMLElement, width: number, height: number): void {
    this.destroy();
    this.width = width;
    this.height = height;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#ffffff');

    this.camera = new THREE.OrthographicCamera(0, width, 0, -height, 0.1, 2000);
    this.camera.position.set(0, 0, 500);
    this.camera.lookAt(0, 0, 0);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.dirLight = new THREE.DirectionalLight(0xffffff, 0.55);
    this.dirLight.position.set(200, -300, 400);
    this.scene.add(this.ambientLight, this.dirLight);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height, false);
    view.appendChild(this.renderer.domElement);

    this.stepGroups = [];
    this.stepIds = [];
    this.renderFrame();
  }

  private renderFrame(): void {
    if (!this.renderer || !this.scene || !this.camera) return;
    this.renderer.render(this.scene, this.camera);
  }

  getStepIds(): string[] {
    return [...this.stepIds];
  }

  private collectMaterials(object: THREE.Object3D): THREE.Material[] {
    const mats: THREE.Material[] = [];
    object.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
        const m = child.material;
        if (Array.isArray(m)) mats.push(...m);
        else if (m) mats.push(m);
      }
    });
    return mats;
  }

  private async fadeIn(object: THREE.Object3D, durationMs: number): Promise<void> {
    const materials = this.collectMaterials(object);
    for (const mat of materials) {
      mat.transparent = true;
      mat.opacity = 0;
    }
    this.renderFrame();

    const start = performance.now();
    await new Promise<void>((resolve) => {
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        const eased = 1 - (1 - t) ** 3;
        for (const mat of materials) {
          mat.opacity = eased;
        }
        this.renderFrame();
        if (t < 1) {
          this.rafId = requestAnimationFrame(tick);
        } else {
          resolve();
        }
      };
      this.rafId = requestAnimationFrame(tick);
    });
  }

  async addStepWithFadeIn(primitives: ThreePrimitive[], stepIndex: number): Promise<string> {
    if (!this.scene) {
      throw new Error('Three.js 未初始化');
    }

    const stepName = `step-${stepIndex}`;
    const group = buildStepGroupFromPrimitives(primitives, stepName);
    this.scene.add(group);
    this.stepGroups.push(group);
    this.stepIds.push(stepName);

    await this.fadeIn(group, fadeDurationMs());
    return stepName;
  }

  /** Add step without fade animation (for restoring saved drawings). */
  addStepImmediate(primitives: ThreePrimitive[], stepIndex: number): string {
    if (!this.scene) {
      throw new Error('Three.js 未初始化');
    }
    const stepName = `step-${stepIndex}`;
    const group = buildStepGroupFromPrimitives(primitives, stepName);
    this.scene.add(group);
    this.stepGroups.push(group);
    this.stepIds.push(stepName);
    this.renderFrame();
    return stepName;
  }

  /** Replace canvas content with saved steps. */
  loadFromSavedSteps(
    steps: Array<{ label: string; primitives: ThreePrimitive[] }>,
  ): void {
    this.clear();
    steps.forEach((step, i) => {
      this.addStepImmediate(step.primitives, i);
    });
  }

  undoLastStep(): boolean {
    if (!this.scene || this.stepGroups.length === 0) return false;
    const last = this.stepGroups.pop()!;
    this.stepIds.pop();
    this.scene.remove(last);
    last.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        const m = child.material;
        if (Array.isArray(m)) m.forEach((mat) => mat.dispose());
        else m?.dispose();
      }
    });
    this.renderFrame();
    return true;
  }

  clear(): void {
    if (!this.scene) return;
    for (const group of this.stepGroups) {
      this.scene.remove(group);
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          const m = child.material;
          if (Array.isArray(m)) m.forEach((mat) => mat.dispose());
          else m?.dispose();
        }
      });
    }
    this.stepGroups = [];
    this.stepIds = [];
    this.renderFrame();
  }

  resize(width: number, height: number): void {
    if (!this.renderer || !this.camera) return;
    this.width = width;
    this.height = height;
    this.camera.left = 0;
    this.camera.right = width;
    this.camera.top = 0;
    this.camera.bottom = -height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.renderFrame();
  }

  async exportPNG(): Promise<string> {
    if (!this.renderer) throw new Error('Three.js 未初始化');
    this.renderFrame();
    return this.renderer.domElement.toDataURL('image/png');
  }

  async exportSVG(): Promise<string> {
    const png = await this.exportPNG();
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}"><image href="${png}" width="${this.width}" height="${this.height}"/></svg>`;
  }

  destroy(): void {
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.clear();
    this.renderer?.dispose();
    if (this.renderer?.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.renderer = null;
    this.scene = null;
    this.camera = null;
  }
}

export function getThreeManager(): ThreeManager {
  return ThreeManager.getInstance();
}

/** @deprecated use getThreeManager */
export const getLeaferManager = getThreeManager;
