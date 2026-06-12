/**
 * @module paper-renderer/Templates
 * 预设绘图模板
 *
 * 提供常用图形的预设模板（小猫、小狗、人物等），
 * 避免每次都需要 LLM 生成完整代码。
 */

import paper from 'paper';

export type TemplateType = 'cat' | 'dog' | 'tree' | 'house' | 'person' | 'star' | 'heart' | 'cloud';

/** 模板渲染函数类型 */
type TemplateRenderFn = (
  ctx: {
    paper: typeof paper;
    center: { x: number; y: number };
    size: number;
    color: string;
    strokeColor?: string;
  },
) => void;

/** 预设模板注册表 */
const TEMPLATES: Record<TemplateType, TemplateRenderFn> = {
  /** 小猫模板 - 简单轮廓 */
  cat: (ctx) => {
    const { paper, center, size, color, strokeColor } = ctx;
    const p = paper;

    // 身体 (椭圆)
    const body = new p.Path.Ellipse({
      center: new p.Point(center.x, center.y + size * 0.1),
      size: new p.Size(size * 0.8, size * 0.5),
      fillColor: color,
      strokeColor,
    });

    // 头部 (圆形)
    const head = new p.Path.Circle({
      center: new p.Point(center.x, center.y - size * 0.35),
      radius: size * 0.25,
      fillColor: color,
      strokeColor,
    });

    // 左耳朵
    const leftEar = new p.Path({
      segments: [
        [center.x - size * 0.2, center.y - size * 0.5],
        [center.x - size * 0.3, center.y - size * 0.7],
        [center.x - size * 0.1, center.y - size * 0.55],
      ],
      closed: true,
      fillColor: color,
      strokeColor,
    });

    // 右耳朵
    const rightEar = new p.Path({
      segments: [
        [center.x + size * 0.2, center.y - size * 0.5],
        [center.x + size * 0.1, center.y - size * 0.55],
        [center.x + size * 0.3, center.y - size * 0.7],
      ],
      closed: true,
      fillColor: color,
      strokeColor,
    });

    // 眼睛 (两个小圆)
    new p.Path.Circle({
      center: new p.Point(center.x - size * 0.1, center.y - size * 0.35),
      radius: size * 0.04,
      fillColor: 'black',
    });
    new p.Path.Circle({
      center: new p.Point(center.x + size * 0.1, center.y - size * 0.35),
      radius: size * 0.04,
      fillColor: 'black',
    });

    // 尾巴 (曲线)
    const tail = new p.Path({
      strokeColor,
      strokeWidth: size * 0.05,
      fill: null,
    });
    tail.moveTo(new p.Point(center.x + size * 0.4, center.y + size * 0.1));
    tail.cubicCurveTo(
      new p.Point(center.x + size * 0.6, center.y - size * 0.1),
      new p.Point(center.x + size * 0.7, center.y + size * 0.1),
      new p.Point(center.x + size * 0.5, center.y + size * 0.3),
    );
  },

  /** 小狗模板 - 简单轮廓 */
  dog: (ctx) => {
    const { paper, center, size, color, strokeColor } = ctx;
    const p = paper;

    // 身体
    const body = new p.Path.Ellipse({
      center: new p.Point(center.x, center.y),
      size: new p.Size(size * 0.9, size * 0.5),
      fillColor: color,
      strokeColor,
    });

    // 头部
    const head = new p.Path.Circle({
      center: new p.Point(center.x - size * 0.4, center.y - size * 0.3),
      radius: size * 0.25,
      fillColor: color,
      strokeColor,
    });

    // 耳朵 (下垂)
    new p.Path.Ellipse({
      center: new p.Point(center.x - size * 0.55, center.y - size * 0.15),
      size: new p.Size(size * 0.12, size * 0.2),
      fillColor: color,
      strokeColor,
    });

    // 眼睛
    new p.Path.Circle({
      center: new p.Point(center.x - size * 0.45, center.y - size * 0.35),
      radius: size * 0.04,
      fillColor: 'black',
    });

    // 鼻子
    new p.Path.Circle({
      center: new p.Point(center.x - size * 0.55, center.y - size * 0.25),
      radius: size * 0.05,
      fillColor: 'black',
    });

    // 尾巴 (向上翘)
    const tail = new p.Path({
      strokeColor,
      strokeWidth: size * 0.06,
      fill: null,
    });
    tail.moveTo(new p.Point(center.x + size * 0.45, center.y));
    tail.cubicCurveTo(
      new p.Point(center.x + size * 0.6, center.y - size * 0.2),
      new p.Point(center.x + size * 0.7, center.y - size * 0.4),
      new p.Point(center.x + size * 0.55, center.y - size * 0.5),
    );

    // 四条腿
    const legWidth = size * 0.12;
    const legHeight = size * 0.25;
    [
      { x: center.x - size * 0.25, y: center.y + size * 0.2 },
      { x: center.x - size * 0.1, y: center.y + size * 0.2 },
      { x: center.x + size * 0.15, y: center.y + size * 0.2 },
      { x: center.x + size * 0.3, y: center.y + size * 0.2 },
    ].forEach((pos) => {
      new p.Path.Rectangle({
        point: new p.Point(pos.x - legWidth / 2, pos.y),
        size: new p.Size(legWidth, legHeight),
        fillColor: color,
        strokeColor,
      });
    });
  },

  /** 树模板 */
  tree: (ctx) => {
    const { paper, center, size, color, strokeColor } = ctx;
    const p = paper;

    // 树干
    new p.Path.Rectangle({
      point: new p.Point(center.x - size * 0.1, center.y + size * 0.1),
      size: new p.Size(size * 0.2, size * 0.5),
      fillColor: '#8B4513',
      strokeColor,
    });

    // 树冠 (三角形)
    const crown = new p.Path({
      segments: [
        [center.x, center.y - size * 0.5],
        [center.x - size * 0.4, center.y + size * 0.1],
        [center.x + size * 0.4, center.y + size * 0.1],
      ],
      closed: true,
      fillColor: color,
      strokeColor,
    });

    // 第二层树冠
    new p.Path({
      segments: [
        [center.x, center.y - size * 0.7],
        [center.x - size * 0.3, center.y - size * 0.2],
        [center.x + size * 0.3, center.y - size * 0.2],
      ],
      closed: true,
      fillColor: color,
      strokeColor,
    });
  },

  /** 房子模板 */
  house: (ctx) => {
    const { paper, center, size, color, strokeColor } = ctx;
    const p = paper;

    // 房体
    new p.Path.Rectangle({
      point: new p.Point(center.x - size * 0.4, center.y),
      size: new p.Size(size * 0.8, size * 0.5),
      fillColor: color,
      strokeColor,
    });

    // 屋顶 (三角形)
    new p.Path({
      segments: [
        [center.x, center.y - size * 0.3],
        [center.x - size * 0.5, center.y],
        [center.x + size * 0.5, center.y],
      ],
      closed: true,
      fillColor: '#8B0000',
      strokeColor,
    });

    // 门
    new p.Path.Rectangle({
      point: new p.Point(center.x - size * 0.08, center.y + size * 0.2),
      size: new p.Size(size * 0.16, size * 0.3),
      fillColor: '#654321',
      strokeColor,
    });

    // 窗户
    [
      { x: center.x - size * 0.25, y: center.y + size * 0.15 },
      { x: center.x + size * 0.17, y: center.y + size * 0.15 },
    ].forEach((pos) => {
      new p.Path.Rectangle({
        point: new p.Point(pos.x, pos.y),
        size: new p.Size(size * 0.12, size * 0.12),
        fillColor: '#87CEEB',
        strokeColor,
      });
    });
  },

  /** 人物模板 - 火柴人 */
  person: (ctx) => {
    const { paper, center, size, strokeColor } = ctx;
    const p = paper;
    const color = 'none';

    // 头部
    new p.Path.Circle({
      center: new p.Point(center.x, center.y - size * 0.4),
      radius: size * 0.15,
      fillColor: '#FFDAB9',
      strokeColor,
    });

    // 身体
    new p.Path.Line({
      from: new p.Point(center.x, center.y - size * 0.25),
      to: new p.Point(center.x, center.y + size * 0.1),
      strokeColor: strokeColor || 'black',
      strokeWidth: size * 0.05,
    });

    // 手臂
    new p.Path.Line({
      from: new p.Point(center.x - size * 0.3, center.y - size * 0.1),
      to: new p.Point(center.x + size * 0.3, center.y - size * 0.1),
      strokeColor: strokeColor || 'black',
      strokeWidth: size * 0.05,
    });

    // 腿
    new p.Path.Line({
      from: new p.Point(center.x, center.y + size * 0.1),
      to: new p.Point(center.x - size * 0.2, center.y + size * 0.4),
      strokeColor: strokeColor || 'black',
      strokeWidth: size * 0.05,
    });
    new p.Path.Line({
      from: new p.Point(center.x, center.y + size * 0.1),
      to: new p.Point(center.x + size * 0.2, center.y + size * 0.4),
      strokeColor: strokeColor || 'black',
      strokeWidth: size * 0.05,
    });
  },

  /** 星星模板 */
  star: (ctx) => {
    const { paper, center, size, color, strokeColor } = ctx;
    const p = paper;
    const points = 5;
    const outerRadius = size * 0.4;
    const innerRadius = size * 0.15;

    const path = new p.Path({
      fillColor: color || 'gold',
      strokeColor,
    });

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI * i) / points - Math.PI / 2;
      const x = center.x + Math.cos(angle) * radius;
      const y = center.y + Math.sin(angle) * radius;
      if (i === 0) {
        path.moveTo(new p.Point(x, y));
      } else {
        path.lineTo(new p.Point(x, y));
      }
    }
    path.closePath();
  },

  /** 心形模板 */
  heart: (ctx) => {
    const { paper, center, size, color, strokeColor } = ctx;
    const p = paper;

    const path = new p.Path({
      fillColor: color || 'red',
      strokeColor,
    });

    // 心形路径
    path.moveTo(new p.Point(center.x, center.y + size * 0.3));
    path.cubicCurveTo(
      new p.Point(center.x - size * 0.5, center.y + size * 0.3),
      new p.Point(center.x - size * 0.5, center.y - size * 0.1),
      new p.Point(center.x, center.y - size * 0.15),
    );
    path.cubicCurveTo(
      new p.Point(center.x + size * 0.5, center.y - size * 0.1),
      new p.Point(center.x + size * 0.5, center.y + size * 0.3),
      new p.Point(center.x, center.y + size * 0.3),
    );
    path.closePath();
  },

  /** 云朵模板 */
  cloud: (ctx) => {
    const { paper, center, size, color, strokeColor } = ctx;
    const p = paper;

    const path = new p.Path({
      fillColor: color || 'white',
      strokeColor,
    });

    // 云朵由多个圆弧组成
    const circles = [
      { x: 0, y: 0, r: size * 0.2 },
      { x: size * 0.15, y: -size * 0.05, r: size * 0.25 },
      { x: size * 0.35, y: 0, r: size * 0.2 },
      { x: size * 0.15, y: size * 0.05, r: size * 0.15 },
    ];

    // 构建云朵路径
    path.moveTo(new p.Point(center.x + circles[0].x - circles[0].r, center.y + circles[0].y));

    circles.forEach((circle, i) => {
      const cx = center.x + circle.x;
      const cy = center.y + circle.y;
      const r = circle.r;

      // 上半圆
      path.arcTo(
        new p.Point(cx + r, cy),
        false,
      );
      // 下半圆
      path.arcTo(
        new p.Point(cx - r, cy),
        false,
      );
    });

    path.closePath();
  },
};

/**
 * 模板工具集
 */
export const Templates = {
  /** 检查模板是否存在 */
  hasTemplate(type: TemplateType): boolean {
    return type in TEMPLATES;
  },

  /** 渲染模板 */
  render(type: TemplateType, options: {
    center?: { x: number; y: number };
    size?: number;
    color?: string;
    strokeColor?: string;
  } = {}): void {
    const template = TEMPLATES[type];
    if (!template) {
      throw new Error(`模板 "${type}" 不存在`);
    }

    const ctx = {
      paper,
      center: options.center || { x: 400, y: 300 },
      size: options.size || 200,
      color: options.color || 'black',
      strokeColor: options.strokeColor,
    };

    template(ctx);
    paper.view.update();
  },

  /** 获取所有模板类型 */
  getAllTypes(): TemplateType[] {
    return Object.keys(TEMPLATES) as TemplateType[];
  },
};