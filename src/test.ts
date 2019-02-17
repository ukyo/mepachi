document.addEventListener("dragenter", e => e.preventDefault());
document.addEventListener("dragover", e => e.preventDefault());
document.addEventListener("drop", e => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  const reader = new FileReader();
  reader.readAsArrayBuffer(file);
  reader.onloadend = e => {
    const bytes = new Uint8Array(reader.result);
    const mainEl = document.querySelector("main");
    for (let i = 0; i < bytes.length; i += 224 * 224 * 3 + 14) {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 224;
      mainEl.appendChild(canvas);

      const ctx = canvas.getContext("2d");
      const imageData = ctx.createImageData(224, 224);
      const rgbData = bytes.slice(i, i + 224 * 224 * 3);
      for (let j = 0; j < rgbData.length / 3; ++j) {
        imageData.data[j * 4] = rgbData[j * 3];
        imageData.data[j * 4 + 1] = rgbData[j * 3 + 1];
        imageData.data[j * 4 + 2] = rgbData[j * 3 + 2];
        imageData.data[j * 4 + 3] = 255;
      }
      ctx.putImageData(imageData, 0, 0);
      const points = bytes.slice(i + 224 * 224 * 3, i + 224 * 224 * 3 + 14);
      ctx.strokeStyle = "#40ff46";
      for (let j = 0; j < 7; ++j) {
        ctx.beginPath();
        ctx.arc(points[j * 2], points[j * 2 + 1], 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  };
});
