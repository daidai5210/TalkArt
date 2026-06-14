/**
 * Builds Three.js Object3D groups from typed primitive arrays.
 * Pixel coords: origin top-left, y increases downward (mapped to -Y in scene).
 */

import * as THREE from 'three';
import type { ThreePrimitive } from './primitive-types';

function num(v: number | undefined, fallback: number): number {
  return v != null && Number.isFinite(v) ? v : fallback;
}

function parseColor(raw: string | undefined, fallback = '#cccccc'): THREE.Color {
  if (raw && raw.length > 0) return new THREE.Color(raw);
  return new THREE.Color(fallback);
}

function toThreeY(y: number): number {
  return -y;
}

function makeMaterial(p: ThreePrimitive): THREE.MeshStandardMaterial {
  const opacity = num(p.opacity, 1);
  return new THREE.MeshStandardMaterial({
    color: parseColor(p.color),
    transparent: opacity < 1,
    opacity,
    roughness: num(p.roughness, 0.65),
    metalness: num(p.metalness, 0.05),
    side: THREE.DoubleSide,
  });
}

function buildPrimitiveMesh(p: ThreePrimitive): THREE.Object3D | null {
  const x = p.x;
  const y = p.y;
  const z = num(p.z, 0);
  const rotationZ = (num(p.rotation, 0) * Math.PI) / 180;

  switch (p.kind) {
    case 'plane': {
      const w = num(p.width, 100);
      const h = num(p.height, 100);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), makeMaterial(p));
      mesh.position.set(x + w / 2, toThreeY(y + h / 2), z);
      mesh.rotation.z = rotationZ;
      return mesh;
    }
    case 'circle': {
      const rx = num(p.width, num(p.radius, 20) * 2) / 2;
      const ry = num(p.height, rx * 2) / 2;
      const base = Math.max(rx, ry);
      const mesh = new THREE.Mesh(new THREE.CircleGeometry(base, 48), makeMaterial(p));
      mesh.scale.set(rx / base, ry / base, 1);
      mesh.position.set(x, toThreeY(y), z);
      mesh.rotation.z = rotationZ;
      return mesh;
    }
    case 'box': {
      const w = num(p.width, 80);
      const h = num(p.height, 80);
      const d = num(p.depth, 20);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), makeMaterial(p));
      mesh.position.set(x + w / 2, toThreeY(y + h / 2), z + d / 2);
      mesh.rotation.z = rotationZ;
      return mesh;
    }
    case 'sphere': {
      const r = num(p.radius, 40);
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), makeMaterial(p));
      mesh.position.set(x, toThreeY(y), z);
      mesh.rotation.z = rotationZ;
      return mesh;
    }
    case 'cylinder': {
      const rTop = num(p.radiusTop, num(p.radius, 30));
      const rBottom = num(p.radiusBottom, rTop);
      const h = num(p.height, 60);
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(rTop, rBottom, h, 32),
        makeMaterial(p),
      );
      mesh.position.set(x, toThreeY(y) - h / 2, z);
      mesh.rotation.z = rotationZ;
      return mesh;
    }
    case 'cone': {
      const r = num(p.radius, 30);
      const h = num(p.height, 60);
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0, r, h, 32),
        makeMaterial(p),
      );
      mesh.position.set(x, toThreeY(y) - h / 2, z);
      mesh.rotation.z = rotationZ;
      return mesh;
    }
    case 'torus': {
      const r = num(p.radius, 40);
      const tube = num(p.tube, 12);
      const mesh = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 16, 48), makeMaterial(p));
      mesh.position.set(x, toThreeY(y), z);
      mesh.rotation.z = rotationZ;
      return mesh;
    }
    case 'ring': {
      const inner = num(p.innerRadius, num(p.radius, 20) * 0.5);
      const outer = num(p.outerRadius, num(p.radius, 40));
      const mesh = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 48), makeMaterial(p));
      mesh.position.set(x, toThreeY(y), z);
      mesh.rotation.z = rotationZ;
      return mesh;
    }
    case 'line': {
      const toX = num(p.toX, x);
      const toY = num(p.toY, y);
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, toThreeY(y), z),
        new THREE.Vector3(toX, toThreeY(toY), z),
      ]);
      const material = new THREE.LineBasicMaterial({
        color: parseColor(p.color, '#ffffff'),
        linewidth: num(p.strokeWidth, 2),
      });
      return new THREE.Line(geometry, material);
    }
    default:
      return null;
  }
}

export function buildStepGroupFromPrimitives(
  primitives: ThreePrimitive[],
  stepName: string,
): THREE.Group {
  const group = new THREE.Group();
  group.name = stepName;
  for (const p of primitives) {
    const obj = buildPrimitiveMesh(p);
    if (obj) group.add(obj);
  }
  return group;
}
