/**
 * @module leafer-renderer/LeaferManager
 * Singleton managing the Leafer canvas lifecycle and step rendering.
 */

import { Leafer } from 'leafer-ui';
import '@leafer-in/animate';
import '@leafer-in/export';
import type { LeaferStepJSON } from './types';
import { withFadeInAnimation } from './LeaferStepAnimator';

let instance: LeaferManager | null = null;

export class LeaferManager {
  private leafer: Leafer | null = null;
  private stepIds: string[] = [];

  static getInstance(): LeaferManager {
    if (!instance) {
      instance = new LeaferManager();
    }
    return instance;
  }

  static resetInstance(): void {
    instance?.destroy();
    instance = null;
  }

  attach(view: HTMLElement, width: number, height: number): void {
    if (this.leafer) {
      this.leafer.destroy();
    }
    this.leafer = new Leafer({
      view,
      width,
      height,
      fill: '#1a1a2e',
    });
    this.stepIds = [];
  }

  getLeafer(): Leafer | null {
    return this.leafer;
  }

  getStepIds(): string[] {
    return [...this.stepIds];
  }

  async addStepWithFadeIn(stepJson: LeaferStepJSON, stepIndex: number): Promise<string> {
    if (!this.leafer) {
      throw new Error('Leafer 未初始化');
    }

    const stepName = stepJson.name ?? `step-${stepIndex}`;
    const rootJson: LeaferStepJSON =
      stepJson.tag === 'Group'
        ? { ...stepJson, name: stepName }
        : { tag: 'Group', name: stepName, children: [stepJson] };

    const payload = withFadeInAnimation(rootJson);
    this.leafer.add(payload);
    this.stepIds.push(stepName);
    return stepName;
  }

  undoLastStep(): boolean {
    if (!this.leafer || this.stepIds.length === 0) return false;
    const lastName = this.stepIds.pop()!;
    const node = this.leafer.findOne(`#${lastName}`) ?? this.leafer.findOne(`[name="${lastName}"]`);
    if (node) {
      node.remove();
      return true;
    }
    return false;
  }

  clear(): void {
    if (!this.leafer) return;
    this.leafer.clear();
    this.stepIds = [];
  }

  resize(width: number, height: number): void {
    if (!this.leafer) return;
    this.leafer.resize({ width, height });
  }

  async exportPNG(): Promise<string> {
    if (!this.leafer) throw new Error('Leafer 未初始化');
    const result = await this.leafer.export('png');
    if (typeof result.data === 'string') return result.data;
    if (result.data instanceof Blob) {
      return URL.createObjectURL(result.data);
    }
    throw new Error('PNG 导出失败');
  }

  async exportSVG(): Promise<string> {
    if (!this.leafer) throw new Error('Leafer 未初始化');
    const result = await this.leafer.export('svg');
    if (typeof result.data === 'string') return result.data;
    throw new Error('SVG 导出失败');
  }

  destroy(): void {
    this.leafer?.destroy();
    this.leafer = null;
    this.stepIds = [];
  }
}

export function getLeaferManager(): LeaferManager {
  return LeaferManager.getInstance();
}
