/**
 * Builds Three.js Object3D trees from declarative step JSON.
 * Pixel coords: origin top-left, y increases downward (mapped to -Y in scene).
 */

import * as THREE from 'three';
import type { ThreeStepJSON } from './types';

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function parseColor(raw: unknown, fallback = '#ffffff'): THREE.Color {
  if (typeof raw === 'string' && raw.length > 0) return new THREE.Color(raw);
  return new THREE.Color(fallback);
}

/** Screen pixel Y → Three.js Y (top-left origin). */
function toThreeY(y: number): number {
  return -y;
}

function isCenterAnchored(tag: string): boolean {
  return (
    tag === 'Ellipse' ||
    tag === 'Circle' ||
    tag === 'Sphere' ||
    tag === 'Torus' ||
    tag === 'Ring' ||
    tag === 'Cylinder' ||
    tag === 'Cone'
  );
}

function makeMaterial(node: ThreeStepJSON): THREE.MeshStandardMaterial {
  const color = parseColor(node.color ?? node.fill, '#cccccc');
  const opacity = num(node.opacity, 1);
  return new THREE.MeshStandardMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    roughness: num(node.roughness, 0.65),
    metalness: num(node.metalness, 0.05),
    side: THREE.DoubleSide,
  });
}

function buildMesh(node: ThreeStepJSON): THREE.Object3D | null {
  const tag = String(node.tag ?? '');
  const x = num(node.x);
  const y = num(node.y);
  const z = num(node.z);
  const width = num(node.width);
  const height = num(node.height);
  const depth = num(node.depth, Math.min(width, height) * 0.25 || 8);
  const rotationZ = (num(node.rotation) * Math.PI) / 180;

  if (tag === 'Group') {
    const group = new THREE.Group();
    group.name = typeof node.name === 'string' ? node.name : '';
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        const built = buildObject(child as ThreeStepJSON);
        if (built) group.add(built);
      }
    }
    return group;
  }

  if (tag === 'Line') {
    const toX = num(node.toX ?? (node.to as { x?: number } | undefined)?.x, x + width);
    const toY = num(node.toY ?? (node.to as { y?: number } | undefined)?.y, y + height);
    const points = [
      new THREE.Vector3(x, toThreeY(y), z),
      new THREE.Vector3(toX, toThreeY(toY), z),
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: parseColor(node.color ?? node.stroke, '#ffffff'),
      linewidth: num(node.strokeWidth, 2),
    });
    const line = new THREE.Line(geometry, material);
    line.name = typeof node.name === 'string' ? node.name : '';
    return line;
  }

  let geometry: THREE.BufferGeometry | null = null;
  let mesh: THREE.Mesh | null = null;

  switch (tag) {
    case 'Rect':
    case 'Plane': {
      const w = width || 100;
      const h = height || 100;
      geometry = new THREE.PlaneGeometry(w, h);
      mesh = new THREE.Mesh(geometry, makeMaterial(node));
      if (tag === 'Rect') {
        mesh.position.set(x + w / 2, toThreeY(y + h / 2), z);
      } else {
        mesh.position.set(
          isCenterAnchored(tag) ? x : x + w / 2,
          isCenterAnchored(tag) ? toThreeY(y) : toThreeY(y + h / 2),
          z,
        );
      }
      break;
    }
    case 'Ellipse':
    case 'Circle': {
      const rx = (width || num(node.radius) * 2 || 40) / 2;
      const ry = (height || width || num(node.radius) * 2 || 40) / 2;
      geometry = new THREE.CircleGeometry(Math.max(rx, ry), 48);
      mesh = new THREE.Mesh(geometry, makeMaterial(node));
      mesh.scale.set(rx / Math.max(rx, ry), ry / Math.max(rx, ry), 1);
      mesh.position.set(x, toThreeY(y), z);
      break;
    }
    case 'Box': {
      const w = width || 80;
      const h = height || 80;
      const d = depth || 20;
      geometry = new THREE.BoxGeometry(w, h, d);
      mesh = new THREE.Mesh(geometry, makeMaterial(node));
      mesh.position.set(x + w / 2, toThreeY(y + h / 2), z + d / 2);
      break;
    }
    case 'Sphere': {
      const r = num(node.radius, Math.max(width, height) / 2 || 40);
      geometry = new THREE.SphereGeometry(r, 32, 24);
      mesh = new THREE.Mesh(geometry, makeMaterial(node));
      mesh.position.set(x, toThreeY(y), z);
      break;
    }
    case 'Cylinder': {
      const rTop = num(node.radiusTop, num(node.radius, width / 2 || 30));
      const rBottom = num(node.radiusBottom, rTop);
      const h = height || 60;
      geometry = new THREE.CylinderGeometry(rTop, rBottom, h, 32);
      mesh = new THREE.Mesh(geometry, makeMaterial(node));
      mesh.position.set(x, toThreeY(y) - h / 2, z);
      break;
    }
    case 'Cone': {
      const r = num(node.radius, width / 2 || 30);
      const h = height || 60;
      geometry = new THREE.CylinderGeometry(0, r, h, 32);
      mesh = new THREE.Mesh(geometry, makeMaterial(node));
      mesh.position.set(x, toThreeY(y) - h / 2, z);
      break;
    }
    case 'Torus': {
      const r = num(node.radius, 40);
      const tube = num(node.tube, 12);
      geometry = new THREE.TorusGeometry(r, tube, 16, 48);
      mesh = new THREE.Mesh(geometry, makeMaterial(node));
      mesh.position.set(x, toThreeY(y), z);
      break;
    }
    case 'Ring': {
      const inner = num(node.innerRadius, num(node.radius, 20) * 0.5);
      const outer = num(node.outerRadius, num(node.radius, 40));
      geometry = new THREE.RingGeometry(inner, outer, 48);
      mesh = new THREE.Mesh(geometry, makeMaterial(node));
      mesh.position.set(x, toThreeY(y), z);
      break;
    }
    default:
      return null;
  }

  if (!mesh) return null;
  mesh.name = typeof node.name === 'string' ? node.name : '';
  mesh.rotation.z = rotationZ;
  return mesh;
}

export function buildObject(node: ThreeStepJSON): THREE.Object3D | null {
  return buildMesh(node);
}

export function buildStepGroup(stepJson: ThreeStepJSON, stepName: string): THREE.Group {
  const root =
    stepJson.tag === 'Group'
      ? (buildObject({ ...stepJson, name: stepName }) as THREE.Group)
      : (() => {
          const group = new THREE.Group();
          group.name = stepName;
          const child = buildObject(stepJson);
          if (child) group.add(child);
          return group;
        })();

  if (!root) {
    const empty = new THREE.Group();
    empty.name = stepName;
    return empty;
  }
  root.name = stepName;
  return root;
}
