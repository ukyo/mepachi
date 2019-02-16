import { fabric } from "fabric";

export interface CircleWithLine extends fabric.Circle {
  in: fabric.Line;
  out: fabric.Line;
}

const EYE_POINT_RADIUS = 7;

function createCircle(left: number, top: number) {
  const circle = new fabric.Circle({
    left,
    top,
    radius: EYE_POINT_RADIUS,
    fill: "#40ff46",
    hasControls: false,
    hasBorders: false
  });
  return circle;
}

function createLine(coords: number[]) {
  return new fabric.Line(coords, {
    stroke: "#40ff46",
    strokeWidth: 1,
    selectable: false,
    evented: false
  });
}

export function createEye(width: number, height: number) {
  const points = [
    { x: width / 20, y: height / 2 },
    { x: width / 3, y: height / 3 },
    { x: (width / 3) * 2, y: height / 3 },
    { x: width - width / 20, y: height / 2 },
    { x: (width / 3) * 2, y: (height / 3) * 2 },
    { x: width / 3, y: (height / 3) * 2 },
    { x: width / 2, y: height / 2 }
  ];
  const pointsForLine = [...points];
  pointsForLine.pop();
  const lines = pointsForLine.map((p, i) => {
    const [a, b] =
      pointsForLine[pointsForLine.length - 1] !== p
        ? pointsForLine.slice(i, i + 2)
        : [p, pointsForLine[0]];
    return createLine([a.x, a.y, b.x, b.y].map(x => x + EYE_POINT_RADIUS));
  });
  const circles = points.map(p => createCircle(p.x, p.y)) as CircleWithLine[];

  circles.slice(0, -1).forEach((c, i) => {
    c.in = i === 0 ? lines[lines.length - 1] : lines[i - 1];
    c.out = lines[i];
  });
  return {
    lines,
    circles
  };
}

function isCircleWithLine(obj: any): obj is CircleWithLine {
  return obj instanceof fabric.Circle && !!(obj as any).in;
}

export function onMove(ev: fabric.IEvent) {
  const c = ev.target;
  if (!isCircleWithLine(c)) return;
  c.in.set({ x2: c.left + EYE_POINT_RADIUS, y2: c.top + EYE_POINT_RADIUS });
  c.out.set({ x1: c.left + EYE_POINT_RADIUS, y1: c.top + EYE_POINT_RADIUS });
}

function rotate(cx: number, cy: number, x: number, y: number, angle: number) {
  var radians = (Math.PI / 180) * angle,
    cos = Math.cos(radians),
    sin = Math.sin(radians),
    nx = cos * (x - cx) + sin * (y - cy) + cx,
    ny = cos * (y - cy) - sin * (x - cx) + cy;
  return [nx, ny];
}

function scale(cx: number, cy: number, x: number, y: number, s: number) {
  return [(x - cx) * s + cx, (y - cy) * s + cy];
}

export function transformCircles(
  circles: fabric.Circle[],
  cx: number,
  cy: number,
  s: number,
  angle: number
) {
  return circles.map(c => {
    const [x, y] = rotate(cx, cy, c.left + c.radius, c.top + c.radius, angle);
    const [_x, _y] = scale(cx, cy, x, y, s);
    return { left: _x, top: _y };
  });
}

export function circlesToBytes(circles: { top: number; left: number }[]) {
  const bytes = new Uint8Array(circles.length * 2);
  circles.forEach((c, i) => {
    bytes[i * 2] = Math.round(c.left);
    bytes[i * 2 + 1] = Math.round(c.top);
  });
  return bytes;
}
