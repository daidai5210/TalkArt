# Canvas/Paper.js 代码生成 Prompt 模板

## 1. Canvas 2D API 代码模板

### 基本结构
```javascript
// 获取画布中心
const pos = center();

// 设置填充颜色
ctx.fillStyle = color('红色');

// 开始绘制路径
ctx.beginPath();

// 绘制图形（圆形）
ctx.arc(pos.x, pos.y, 50, 0, Math.PI * 2);

// 填充
ctx.fill();
```

### 常用 API

| API | 说明 | 示例 |
|---|---|---|
| `ctx.fillStyle` | 填充颜色 | `ctx.fillStyle = color('红色');` |
| `ctx.strokeStyle` | 描边颜色 | `ctx.strokeStyle = 'black';` |
| `ctx.lineWidth` | 描边宽度 | `ctx.lineWidth = 2;` |
| `ctx.beginPath()` | 开始新路径 | `ctx.beginPath();` |
| `ctx.arc()` | 绘制圆弧 | `ctx.arc(x, y, radius, startAngle, endAngle);` |
| `ctx.rect()` | 绘制矩形 | `ctx.rect(x, y, width, height);` |
| `ctx.moveTo()` | 移动到点 | `ctx.moveTo(x, y);` |
| `ctx.lineTo()` | 绘制直线 | `ctx.lineTo(x, y);` |
| `ctx.fill()` | 填充路径 | `ctx.fill();` |
| `ctx.stroke()` | 描边路径 | `ctx.stroke();` |

## 2. Paper.js API 代码模板

### 基本结构
```javascript
// 绘制圆形
paper.Path.Circle({
  center: [400, 300],
  radius: 50,
  fillColor: 'red',
});

// 绘制矩形
paper.Path.Rectangle({
  point: [300, 200],
  size: [200, 150],
  fillColor: 'blue',
});
```

### 常用 API

| API | 说明 | 示例 |
|---|---|---|
| `paper.Path.Circle` | 绘制圆形 | `paper.Path.Circle({ center: [x,y], radius: r, fillColor: 'color' });` |
| `paper.Path.Rectangle` | 绘制矩形 | `paper.Path.Rectangle({ point: [x,y], size: [w,h], fillColor: 'color' });` |
| `paper.Path.Ellipse` | 绘制椭圆 | `paper.Path.Ellipse({ center: [x,y], size: [w,h], fillColor: 'color' });` |
| `paper.Path.RegularPolygon` | 绘制正多边形 | `paper.Path.RegularPolygon({ center: [x,y], sides: n, radius: r, fillColor: 'color' });` |
| `paper.Path.Line` | 绘制线段 | `paper.Path.Line({ from: [x1,y1], to: [x2,y2], strokeColor: 'color' });` |
| `paper.PointText` | 绘制文字 | `new paper.PointText({ position: [x,y], content: 'text', fillColor: 'color' });` |
| `path.cubicCurveTo()` | 贝塞尔曲线 | `path.cubicCurveTo(handle1, handle2, to);` |

## 3. 预设模板

| 模板名 | 说明 | 参数 |
|---|---|---|
| `cat` | 小猫 | center, size, color, strokeColor |
| `dog` | 小狗 | center, size, color, strokeColor |
| `tree` | 树 | center, size, color, strokeColor |
| `house` | 房子 | center, size, strokeColor |
| `person` | 人物（火柴人） | center, size, strokeColor |
| `star` | 星星 | center, size, color, strokeColor |
| `heart` | 心形 | center, size, color, strokeColor |
| `cloud` | 云朵 | center, size, color, strokeColor |

## 4. 颜色参考

| 中文名 | CSS 颜色 |
|---|---|
| 红色 | #FF0000 |
| 蓝色 | #0000FF |
| 绿色 | #00FF00 |
| 黄色 | #FFFF00 |
| 紫色 | #800080 |
| 橙色 | #FFA500 |
| 粉色 | #FFC0CB |
| 棕色 | #A52A2A |
| 金色 | #FFD700 |
| 银色 | #C0C0C0 |