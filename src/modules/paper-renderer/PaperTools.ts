/**
 * @module paper-renderer/PaperTools
 * Paper.js 高级绘图工具封装
 *
 * 提供高级绘图 API 封装，适合 LLM 生成代码调用。
 * 包括：路径绘制、曲线、形状、符号等。
 */

import paper from 'paper';

/** 绘图选项 */
export interface DrawOptions {
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  position?: { x: number; y: number };
}

/** 点坐标 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Paper.js 绘图工具集合
 */
export const PaperTools = {
  /**
   * 绘制圆形/椭圆
   */
  drawCircle(center: Point, radius: number, options: DrawOptions = {}): paper.Path.Circle {
    const circle = new paper.Path.Circle({
      center: new paper.Point(center.x, center.y),
      radius,
      fillColor: options.fillColor || 'black',
      strokeColor: options.strokeColor,
      strokeWidth: options.strokeWidth,
      opacity: options.opacity,
    });
    return circle;
  },

  /**
   * 绘制矩形
   */
  drawRect(point: Point, width: number, height: number, options: DrawOptions = {}): paper.Path.Rectangle {
    const rect = new paper.Path.Rectangle({
      point: new paper.Point(point.x, point.y),
      size: new paper.Size(width, height),
      fillColor: options.fillColor || 'black',
      strokeColor: options.strokeColor,
      strokeWidth: options.strokeWidth,
      opacity: options.opacity,
    });
    return rect;
  },

  /**
   * 绘制贝塞尔曲线
   */
  drawBezierCurve(
    points: Point[],
    options: DrawOptions = {},
  ): paper.Path {
    const path = new paper.Path({
      strokeColor: options.strokeColor || 'black',
      strokeWidth: options.strokeWidth || 2,
      opacity: options.opacity,
    });

    if (points.length > 0) {
      path.moveTo(new paper.Point(points[0].x, points[0].y));
      for (let i = 1; i < points.length; i++) {
        path.lineTo(new paper.Point(points[i].x, points[i].y));
      }
    }

    return path;
  },

  /**
   * 绘制多边形
   */
  drawPolygon(
    center: Point,
    sides: number,
    radius: number,
    options: DrawOptions = {},
  ): paper.Path.RegularPolygon {
    const polygon = new paper.Path.RegularPolygon({
      center: new paper.Point(center.x, center.y),
      sides,
      radius,
      fillColor: options.fillColor || 'black',
      strokeColor: options.strokeColor,
      strokeWidth: options.strokeWidth,
      opacity: options.opacity,
    });
    return polygon;
  },

  /**
   * 绘制星形
   */
  drawStar(
    center: Point,
    points: number,
    outerRadius: number,
    innerRadius: number,
    options: DrawOptions = {},
  ): paper.Path {
    const path = new paper.Path({
      fillColor: options.fillColor || 'gold',
      strokeColor: options.strokeColor,
      strokeWidth: options.strokeWidth,
      opacity: options.opacity,
    });

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI * i) / points;
      const x = center.x + Math.cos(angle) * radius;
      const y = center.y + Math.sin(angle) * radius;
      if (i === 0) {
        path.moveTo(new paper.Point(x, y));
      } else {
        path.lineTo(new paper.Point(x, y));
      }
    }
    path.closePath();
    return path;
  },

  /**
   * 绘制椭圆
   */
  drawEllipse(
    center: Point,
    width: number,
    height: number,
    options: DrawOptions = {},
  ): paper.Path.Ellipse {
    const ellipse = new paper.Path.Ellipse({
      center: new paper.Point(center.x, center.y),
      size: new paper.Size(width, height),
      fillColor: options.fillColor || 'black',
      strokeColor: options.strokeColor,
      strokeWidth: options.strokeWidth,
      opacity: options.opacity,
    });
    return ellipse;
  },

  /**
   * 绘制线条
   */
  drawLine(from: Point, to: Point, options: DrawOptions = {}): paper.Path.Line {
    const line = new paper.Path.Line({
      from: new paper.Point(from.x, from.y),
      to: new paper.Point(to.x, to.y),
      strokeColor: options.strokeColor || 'black',
      strokeWidth: options.strokeWidth || 2,
      opacity: options.opacity,
    });
    return line;
  },

  /**
   * 绘制文字
   */
  drawText(
    position: Point,
    text: string,
    fontSize: number = 24,
    options: DrawOptions = {},
  ): paper.PointText {
    const pointText = new paper.PointText({
      position: new paper.Point(position.x, position.y),
      content: text,
      fillColor: options.fillColor || 'black',
      opacity: options.opacity,
      fontSize,
      fontFamily: 'sans-serif',
    });
    return pointText;
  },
};