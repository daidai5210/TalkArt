/**
 * Code-gen renderer for 简笔画 (simple line drawings).
 * Only supports simple shapes: Circle, Plane (rect), no complex geometry.
 */

export interface CollectedShape {
  type: 'rect' | 'circle';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  color: string;
  opacity: number;
  layer: number;
}

/** Create a mock THREE object for simple shapes only. */
function createMockTHREE() {
  const scene = {
    children: [] as unknown[],
    add(obj: unknown) {
      this.children.push(obj);
    },
  };

  const THREE = {
    // Simple geometries only
    CircleGeometry: class {
      _type = 'circle';
      _radius: number;
      constructor(radius: number) {
        this._radius = radius;
      }
    },
    PlaneGeometry: class {
      _type = 'plane';
      _width: number;
      _height: number;
      constructor(width: number, height: number) {
        this._width = width;
        this._height = height;
      }
    },

    // Simple material
    MeshBasicMaterial: class {
      _color: string;
      _opacity: number;
      constructor(params: { color?: string | number; opacity?: number } = {}) {
        this._color = normalizeColor(params.color);
        this._opacity = params.opacity ?? 1;
      }
    },

    // Mesh
    Mesh: class {
      position = { x: 0, y: 0, z: 0, set(x: number, y: number, z: number) { this.x = x; this.y = y; this.z = z; } };
      rotation = { x: 0, y: 0, z: 0 };
      scale = { x: 1, y: 1, z: 1, set(x: number, y: number, z: number) { this.x = x; this.y = y; this.z = z; } };
      geometry: unknown;
      material: unknown;
      constructor(geometry: unknown, material: unknown) {
        this.geometry = geometry;
        this.material = material;
      }
    },

    // Group
    Group: class {
      position = { x: 0, y: 0, z: 0, set(x: number, y: number, z: number) { this.x = x; this.y = y; this.z = z; } };
      children: unknown[] = [];
      add(child: unknown) { this.children.push(child); }
    },

    // Color utility
    Color: class {
      _hex: string;
      constructor(c: string | number) {
        this._hex = normalizeColor(c);
      }
    },
  };

  return { THREE, scene };
}

function normalizeColor(c: string | number | undefined): string {
  if (c == null) return '#333333';
  if (typeof c === 'number') {
    return '#' + c.toString(16).padStart(6, '0');
  }
  if (typeof c === 'string') {
    if (c.startsWith('#')) return c;
    const named: Record<string, string> = {
      red: '#ff0000', green: '#00aa00', blue: '#0066ff',
      white: '#ffffff', black: '#000000', yellow: '#ffcc00',
      orange: '#ff8800', purple: '#8800aa', pink: '#ff88aa',
      gray: '#888888', grey: '#888888', brown: '#884422',
    };
    return named[c.toLowerCase()] || c;
  }
  return '#333333';
}

/**
 * Extract shapes from mesh objects.
 */
function extractShapes(mesh: unknown, parentX = 0, parentY = 0, layer = 0): CollectedShape[] {
  const shapes: CollectedShape[] = [];
  const m = mesh as {
    geometry: { _type?: string; _width?: number; _height?: number; _radius?: number };
    material: { _color?: string; _opacity?: number };
    position: { x: number; y: number };
    scale?: { x?: number; y?: number };
    children?: unknown[];
  };

  if (!m) return shapes;

  // Handle Group
  if (m.children && Array.isArray(m.children) && !m.geometry) {
    const gx = m.position?.x || 0;
    const gy = m.position?.y || 0;
    for (const child of m.children) {
      shapes.push(...extractShapes(child, parentX + gx, parentY + gy, layer));
    }
    return shapes;
  }

  if (!m.geometry) return shapes;

  const geo = m.geometry;
  const mat = m.material || {};
  const color = mat._color || '#333333';
  const opacity = mat._opacity ?? 1;
  const x = (m.position?.x || 0) + parentX;
  const y = (m.position?.y || 0) + parentY;
  const scaleX = m.scale?.x || 1;
  const scaleY = m.scale?.y || 1;

  if (geo._type === 'circle') {
    shapes.push({
      type: 'circle',
      x,
      y,
      radius: (geo._radius || 20) * Math.max(Math.abs(scaleX), Math.abs(scaleY)),
      color,
      opacity,
      layer,
    });
  } else if (geo._type === 'plane') {
    shapes.push({
      type: 'rect',
      x: x - ((geo._width || 10) * Math.abs(scaleX)) / 2,
      y: y - ((geo._height || 10) * Math.abs(scaleY)) / 2,
      width: (geo._width || 10) * Math.abs(scaleX),
      height: (geo._height || 10) * Math.abs(scaleY),
      color,
      opacity,
      layer,
    });
  }

  return shapes;
}

/**
 * Execute LLM-generated code and collect shapes.
 */
export function executeDrawCode(code: string, layer: number): CollectedShape[] {
  const { THREE, scene } = createMockTHREE();

  const wrappedCode = `
    ${code}
    if (typeof drawStep === 'function') {
      drawStep(THREE, scene);
    } else if (typeof draw === 'function') {
      draw(THREE, scene);
    }
  `;

  try {
    const fn = new Function('THREE', 'scene', wrappedCode);
    fn(THREE, scene);
  } catch (err) {
    console.error('Code execution error:', err);
    return [];
  }

  const allShapes: CollectedShape[] = [];
  for (let i = 0; i < scene.children.length; i++) {
    const shapes = extractShapes(scene.children[i], 0, 0, layer);
    allShapes.push(...shapes);
  }

  return allShapes;
}

/**
 * Render shapes to SVG.
 * Converts Three.js coords (center origin, y-up) to SVG (top-left, y-down).
 */
export function shapesToSvg(shapes: CollectedShape[], width: number, height: number): string {
  const sorted = [...shapes].sort((a, b) => a.layer - b.layer);
  const cx = width / 2;
  const cy = height / 2;

  const elements = sorted.map((s) => {
    const toSvgX = (x: number) => cx + x;
    const toSvgY = (y: number) => cy - y;

    if (s.type === 'circle') {
      return `<circle cx="${toSvgX(s.x)}" cy="${toSvgY(s.y)}" r="${s.radius}" fill="${s.color}" fill-opacity="${s.opacity}" stroke="#333" stroke-width="2"/>`;
    } else if (s.type === 'rect') {
      return `<rect x="${toSvgX(s.x)}" y="${toSvgY(s.y + (s.height || 0))}" width="${s.width}" height="${s.height}" fill="${s.color}" fill-opacity="${s.opacity}" stroke="#333" stroke-width="2"/>`;
    }
    return '';
  }).filter(Boolean);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="100%" height="100%" fill="#fffef5"/>
${elements.join('\n')}
</svg>`;
}
