import "./style.scss";

import { fabric } from "fabric";
import { createEye, onMove, circlesToBytes, transformCircles } from "./eye";

const annotator = new fabric.Canvas("annotator");
const bg = new fabric.Canvas("bg");
const scaleSlider = document.getElementById("scale") as HTMLInputElement & {
  clearListener: () => any;
};
scaleSlider.clearListener = () => {};
let circles: fabric.Circle[];

annotator.on("object:moving", onMove);

document.addEventListener("dragenter", e => e.preventDefault());
document.addEventListener("dragover", e => e.preventDefault());
document.addEventListener("drop", e => {
  e.preventDefault();
  console.log(e.dataTransfer.files);
  annotator.clear();
  bg.clear();
  const image = new Image();
  image.src = URL.createObjectURL(e.dataTransfer.files[0]);
  image.onload = e => {
    URL.revokeObjectURL(image.src);
    const fi = new fabric.Image(image, {
      left: 0,
      top: 0,
      width: image.width,
      height: image.height,
      hasBorders: false,
      hasControls: false
    });
    bg.add(fi);
    bg.setActiveObject(fi);

    const eye = createEye(224, 224);
    const lines = eye.lines;
    circles = eye.circles;
    [...lines, ...circles].forEach(c => {
      annotator.add(c);
      annotator.setActiveObject(c);
    });
    scaleSlider.clearListener();
    const listener = (e: Event) => {
      fi.scale((e.target as HTMLInputElement).valueAsNumber).setCoords();
      bg.requestRenderAll();
    };
    scaleSlider.addEventListener("input", listener);
    scaleSlider.clearListener = () =>
      scaleSlider.removeEventListener("input", listener);
    fi.transformMatrix;
  };
});

document.getElementById("create").onclick = () => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 448;
  const source = bg.getElement();
  const ctx = canvas.getContext("2d");
  const bytess: Uint8Array[] = [];
  [-20, -15, -10, -5, 0, 5, 10, 15, 20].map(angle => {
    [1, 0.9, 0.8, 0.7].map(scale => {
      ctx.save();
      ctx.translate(224, 224);
      ctx.scale(scale, scale);
      ctx.rotate((Math.PI / 180) * angle);
      ctx.drawImage(source, -224, -224);
      ctx.restore();
      const { data } = ctx.getImageData(112, 112, 224, 224);
      const bytes = new Uint8Array(224 * 224 * 3);
      for (let i = 0; i < 224 * 224; ++i) {
        bytes[i * 3] = data[i * 4];
        bytes[i * 3 + 1] = data[i * 4 + 1];
        bytes[i * 3 + 2] = data[i * 4 + 2];
      }
      bytess.push(bytes);
      bytess.push(
        circlesToBytes(transformCircles(circles, 112, 112, scale, angle))
      );
    });
  });
  const a = document.createElement("a");
  const ev = document.createEvent("MouseEvent");
  a.href = URL.createObjectURL(new Blob(bytess));
  a.download = `eye-annotation-${Date.now()}.dat`;
  ev.initEvent("click", true, true);
  a.dispatchEvent(ev);
};
