export const SKETCH_MARK_KINDS = ['line', 'polyline', 'curve', 'ellipse', 'polygon', 'dot'] as const;

export type SketchMarkKind = (typeof SKETCH_MARK_KINDS)[number];

export function formatSketchCatalogForPrompt(): string {
  return `## 极简笔画 API（renderSketchStep.marks 数组）
每步输出 1~8 个 mark，整幅图通常 6~12 个 mark，复杂主体最多 18 个 mark。
坐标系：左上角 (0,0)，x 向右，y 向下，单位 px。
默认样式：黑色线条、圆角笔触、少量浅色填充。

可用 mark：
- line：直线，{ kind:"line", from:[x1,y1], to:[x2,y2], stroke, width }
- polyline：折线，{ kind:"polyline", points:[[x,y],...], stroke, width }
- curve：柔和曲线，{ kind:"curve", points:[[x,y],...], stroke, width }
- ellipse：椭圆/圆，{ kind:"ellipse", center:[x,y], rx, ry, stroke, fill, width }
- polygon：简单多边形/三角形，{ kind:"polygon", points:[[x,y],...], stroke, fill, width }
- dot：点，{ kind:"dot", center:[x,y], r, fill }

禁止：背景、天空、草地、阴影、高光、纹理、复杂装饰、文字说明。`;
}
