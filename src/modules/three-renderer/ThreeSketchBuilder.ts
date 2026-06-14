import * as THREE from 'three';
import type { SketchMark, SketchPoint } from './sketch-types';

function num(v: number | undefined, fallback: number): number {
  return v != null && Number.isFinite(v) ? v : fallback;
}

function color(raw: string | undefined, fallback = '#222222'): THREE.Color {
  return new THREE.Color(raw && raw.length > 0 ? raw : fallback);
}

function toVec([x, y]: SketchPoint, z: number): THREE.Vector3 {
  return new THREE.Vector3(x, -y, z);
}

function lineMaterial(mark: { stroke?: string; fill?: string; width?: number; opacity?: number }): THREE.LineBasicMaterial {
  const opacity = num(mark.opacity, 1);
  return new THREE.LineBasicMaterial({
    color: color(mark.stroke ?? mark.fill),
    transparent: opacity < 1,
    opacity,
    linewidth: num(mark.width, 3),
  });
}

function fillMaterial(mark: { fill?: string; opacity?: number }): THREE.MeshBasicMaterial {
  const opacity = num(mark.opacity, 1);
  return new THREE.MeshBasicMaterial({
    color: color(mark.fill, '#ffffff'),
    transparent: opacity < 1,
    opacity,
    side: THREE.DoubleSide,
  });
}

function makeLine(points: SketchPoint[], mark: SketchMark, z: number, closed = false): THREE.Line | null {
  if (points.length < 2) return null;
  const pts = closed ? [...points, points[0]] : points;
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts.map((p) => toVec(p, z))),
    lineMaterial(mark),
  );
}

function buildMarkObject(mark: SketchMark, z: number): THREE.Object3D[] {
  switch (mark.kind) {
    case 'line': {
      const line = makeLine([mark.from, mark.to], mark, z);
      return line ? [line] : [];
    }
    case 'polyline': {
      const line = makeLine(mark.points, mark, z);
      return line ? [line] : [];
    }
    case 'curve': {
      if (mark.points.length < 2) return [];
      const curve = new THREE.CatmullRomCurve3(mark.points.map((p) => toVec(p, z)), false, 'centripetal');
      return [new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(32)), lineMaterial(mark))];
    }
    case 'ellipse': {
      const out: THREE.Object3D[] = [];
      if (mark.fill && mark.fill !== 'none') {
        const base = Math.max(mark.rx, mark.ry);
        const mesh = new THREE.Mesh(new THREE.CircleGeometry(base, 48), fillMaterial(mark));
        mesh.position.set(mark.center[0], -mark.center[1], z - 0.1);
        mesh.scale.set(mark.rx / base, mark.ry / base, 1);
        out.push(mesh);
      }
      const curve = new THREE.EllipseCurve(mark.center[0], -mark.center[1], mark.rx, mark.ry, 0, Math.PI * 2);
      out.push(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(64).map((p) => new THREE.Vector3(p.x, p.y, z))), lineMaterial(mark)));
      return out;
    }
    case 'polygon': {
      const out: THREE.Object3D[] = [];
      if (mark.fill && mark.fill !== 'none') {
        const shape = new THREE.Shape();
        shape.moveTo(mark.points[0][0], -mark.points[0][1]);
        for (const [x, y] of mark.points.slice(1)) shape.lineTo(x, -y);
        shape.closePath();
        const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), fillMaterial(mark));
        mesh.position.z = z - 0.1;
        out.push(mesh);
      }
      const line = makeLine(mark.points, mark, z, true);
      if (line) out.push(line);
      return out;
    }
    case 'dot': {
      const mesh = new THREE.Mesh(
        new THREE.CircleGeometry(mark.r, 24),
        new THREE.MeshBasicMaterial({ color: color(mark.fill, '#222222'), transparent: num(mark.opacity, 1) < 1, opacity: num(mark.opacity, 1), side: THREE.DoubleSide }),
      );
      mesh.position.set(mark.center[0], -mark.center[1], z);
      return [mesh];
    }
    default:
      return [];
  }
}

export function buildStepGroupFromSketchMarks(marks: SketchMark[], stepName: string): THREE.Group {
  const group = new THREE.Group();
  group.name = stepName;
  marks.forEach((mark, index) => {
    for (const obj of buildMarkObject(mark, index * 0.1)) group.add(obj);
  });
  return group;
}
