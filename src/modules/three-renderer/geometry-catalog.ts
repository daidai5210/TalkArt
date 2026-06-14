/**
 * Three.js built-in geometry catalog — single source of truth for
 * LLM tool schema, system prompts, validation, and rendering.
 */

export type GeometryKind =
  | 'plane'
  | 'circle'
  | 'box'
  | 'sphere'
  | 'cylinder'
  | 'cone'
  | 'torus'
  | 'ring'
  | 'line';

export type AnchorMode = 'center' | 'topLeft' | 'top';

export interface GeometryDef {
  kind: GeometryKind;
  /** Three.js geometry class name */
  threeClass: string;
  label: string;
  anchor: AnchorMode;
  description: string;
  requiredParams: readonly string[];
  optionalParams: readonly string[];
  example: Record<string, unknown>;
}

export const GEOMETRY_CATALOG: readonly GeometryDef[] = [
  {
    kind: 'plane',
    threeClass: 'PlaneGeometry',
    label: '平面矩形',
    anchor: 'topLeft',
    description: '2D 平面矩形，适合背景块、招牌、简单面板',
    requiredParams: ['x', 'y', 'width', 'height'],
    optionalParams: ['z', 'rotation', 'color', 'opacity', 'roughness', 'metalness'],
    example: { kind: 'plane', x: 100, y: 80, width: 200, height: 120, color: '#4ECDC4', z: 0 },
  },
  {
    kind: 'circle',
    threeClass: 'CircleGeometry',
    label: '圆/椭圆',
    anchor: 'center',
    description: '圆或椭圆（width≠height 时为椭圆）。动物身体、头部、斑点常用',
    requiredParams: ['x', 'y'],
    optionalParams: ['width', 'height', 'radius', 'z', 'rotation', 'color', 'opacity', 'roughness', 'metalness'],
    example: { kind: 'circle', x: 400, y: 300, width: 200, height: 120, color: '#FFFFFF' },
  },
  {
    kind: 'box',
    threeClass: 'BoxGeometry',
    label: '立方体',
    anchor: 'topLeft',
    description: '3D 盒子，适合建筑、方块、立体场景元素',
    requiredParams: ['x', 'y', 'width', 'height', 'depth'],
    optionalParams: ['z', 'rotation', 'color', 'opacity', 'roughness', 'metalness'],
    example: { kind: 'box', x: 300, y: 200, width: 80, height: 80, depth: 40, color: '#888888' },
  },
  {
    kind: 'sphere',
    threeClass: 'SphereGeometry',
    label: '球体',
    anchor: 'center',
    description: '3D 球体，适合头部、星球、球类',
    requiredParams: ['x', 'y', 'radius'],
    optionalParams: ['z', 'rotation', 'color', 'opacity', 'roughness', 'metalness'],
    example: { kind: 'sphere', x: 400, y: 220, radius: 48, color: '#FFE0BD', z: 5 },
  },
  {
    kind: 'cylinder',
    threeClass: 'CylinderGeometry',
    label: '圆柱',
    anchor: 'top',
    description: '圆柱体，x,y 为顶部中心。适合树干、杯子、柱体',
    requiredParams: ['x', 'y', 'radius', 'height'],
    optionalParams: ['radiusTop', 'radiusBottom', 'z', 'rotation', 'color', 'opacity', 'roughness', 'metalness'],
    example: { kind: 'cylinder', x: 400, y: 150, radius: 30, height: 100, color: '#8B4513' },
  },
  {
    kind: 'cone',
    threeClass: 'CylinderGeometry(0,r,h)',
    label: '圆锥',
    anchor: 'top',
    description: '圆锥体，x,y 为顶点（顶部中心）',
    requiredParams: ['x', 'y', 'radius', 'height'],
    optionalParams: ['z', 'rotation', 'color', 'opacity', 'roughness', 'metalness'],
    example: { kind: 'cone', x: 500, y: 200, radius: 40, height: 80, color: '#2ECC71' },
  },
  {
    kind: 'torus',
    threeClass: 'TorusGeometry',
    label: '圆环体',
    anchor: 'center',
    description: '3D 甜甜圈形，适合奥运五环、轮胎、装饰环',
    requiredParams: ['x', 'y', 'radius'],
    optionalParams: ['tube', 'z', 'rotation', 'color', 'opacity', 'roughness', 'metalness'],
    example: { kind: 'torus', x: 200, y: 300, radius: 50, tube: 12, color: '#3498DB' },
  },
  {
    kind: 'ring',
    threeClass: 'RingGeometry',
    label: '2D 圆环',
    anchor: 'center',
    description: '扁平圆环，适合平面五环、光圈。需 innerRadius+outerRadius 或 radius',
    requiredParams: ['x', 'y'],
    optionalParams: ['innerRadius', 'outerRadius', 'radius', 'z', 'rotation', 'color', 'opacity', 'roughness', 'metalness'],
    example: { kind: 'ring', x: 400, y: 300, innerRadius: 35, outerRadius: 50, color: '#E74C3C' },
  },
  {
    kind: 'line',
    threeClass: 'BufferGeometry(Line)',
    label: '线段',
    anchor: 'topLeft',
    description: '直线段，从 (x,y) 到 (toX,toY)。适合轮廓、胡须、简单连线',
    requiredParams: ['x', 'y', 'toX', 'toY'],
    optionalParams: ['z', 'color', 'strokeWidth'],
    example: { kind: 'line', x: 380, y: 250, toX: 420, toY: 250, color: '#333333' },
  },
] as const;

export const GEOMETRY_KINDS: GeometryKind[] = GEOMETRY_CATALOG.map((g) => g.kind);

const catalogByKind = new Map(GEOMETRY_CATALOG.map((g) => [g.kind, g]));

export function getGeometryDef(kind: GeometryKind): GeometryDef | undefined {
  return catalogByKind.get(kind);
}

const ANCHOR_LABEL: Record<AnchorMode, string> = {
  center: '中心点',
  topLeft: '左上角',
  top: '顶部中心',
};

/** Generate LLM-facing geometry API reference from catalog. */
export function formatGeometryCatalogForPrompt(): string {
  const lines = GEOMETRY_CATALOG.map((g) => {
    const req = g.requiredParams.join(', ');
    const opt = g.optionalParams.join(', ');
    return `### ${g.kind}（${g.label}）→ ${g.threeClass}
- 锚点：${ANCHOR_LABEL[g.anchor]}
- 必填：${req}
- 可选：${opt}
- 说明：${g.description}
- 示例：${JSON.stringify(g.example)}`;
  });
  return `## Three.js 图元 API（renderThreeStep.primitives 数组）
每步输出 1~20 个图元对象，每个图元必须含 kind + 对应必填参数。
坐标系：左上角 (0,0)，x 向右，y 向下，单位 px。z 用于层叠（0~50，越大越靠前）。

${lines.join('\n\n')}`;
}

/** JSON Schema properties for a single primitive (tool definition). */
export function buildPrimitiveItemSchema(): Record<string, unknown> {
  return {
    type: 'object',
    description: '单个 Three.js 图元，kind 决定必填参数',
    properties: {
      kind: { type: 'string', enum: GEOMETRY_KINDS, description: '图元类型' },
      x: { type: 'number', description: 'X 坐标（px），含义见 kind 锚点说明' },
      y: { type: 'number', description: 'Y 坐标（px）' },
      z: { type: 'number', description: '层叠深度 0~50，默认 0' },
      width: { type: 'number', description: '宽度（px）' },
      height: { type: 'number', description: '高度（px）' },
      depth: { type: 'number', description: '深度（px），box 必填' },
      radius: { type: 'number', description: '半径（px）' },
      radiusTop: { type: 'number', description: '圆柱顶面半径' },
      radiusBottom: { type: 'number', description: '圆柱底面半径' },
      tube: { type: 'number', description: 'torus 管径' },
      innerRadius: { type: 'number', description: 'ring 内径' },
      outerRadius: { type: 'number', description: 'ring 外径' },
      toX: { type: 'number', description: 'line 终点 X' },
      toY: { type: 'number', description: 'line 终点 Y' },
      rotation: { type: 'number', description: '绕 Z 轴旋转角度（度）' },
      color: { type: 'string', description: '颜色，CSS 格式如 #FF6B6B' },
      opacity: { type: 'number', description: '透明度 0~1' },
      roughness: { type: 'number', description: '粗糙度 0~1，默认 0.65' },
      metalness: { type: 'number', description: '金属度 0~1，默认 0.05' },
      strokeWidth: { type: 'number', description: 'line 线宽（仅视觉效果）' },
    },
    required: ['kind', 'x', 'y'],
  };
}
