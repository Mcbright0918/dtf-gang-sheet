const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const DPI = 300;
let canvasWidthInches = 22;
let canvasHeightInches = 39;
let canvasWidth = canvasWidthInches * DPI;
let canvasHeight = canvasHeightInches * DPI;

let images = [];
let selected = null;
let dragging = false, offsetX = 0, offsetY = 0;

const rulerTop = document.getElementById("ruler-top");
const rulerLeft = document.getElementById("ruler-left");
const unitSelect = document.getElementById("unit");
const canvasSizeInfo = document.getElementById("canvasSizeInfo");

function resizeCanvasToFitScreen() {
  const container = document.querySelector('.canvas-container');
  const scaleX = container.clientWidth / canvasWidth;
  const scaleY = container.clientHeight / canvasHeight;
  const scale = Math.min(scaleX, scaleY);

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  canvas.style.transform = `scale(${scale})`;
  canvas.style.transformOrigin = 'top left';
  canvasSizeInfo.textContent = `${canvasWidthInches}" × ${canvasHeightInches}" @ ${DPI} DPI`;
  draw();
}

window.addEventListener('resize', resizeCanvasToFitScreen);
resizeCanvasToFitScreen();

document.getElementById("upload").addEventListener("change", e => {
  [...e.target.files].forEach(file => {
    const img = new Image();
    img.onload = () => {
      images.push({ img, x: 100, y: 100, w: img.width, h: img.height });
      draw();
    };
    img.src = URL.createObjectURL(file);
  });
});

function drawRulers() {
  const u = unitSelect.value;
  const step = u === "in" ? DPI : DPI / 2.54;
  const labelStep = Math.round(step);

  rulerTop.innerHTML = "";
  for (let x = 0; x <= canvas.width; x += labelStep) {
    const label = document.createElement("div");
    label.style.position = "absolute";
    label.style.left = `${x + 40}px`;
    label.style.bottom = "0px";
    label.style.fontSize = "10px";
    label.innerText = u === "in" ? (x / DPI).toFixed(0) : ((x / DPI) * 2.54).toFixed(0);
    rulerTop.appendChild(label);
  }

  rulerLeft.innerHTML = "";
  for (let y = 0; y <= canvas.height; y += labelStep) {
    const label = document.createElement("div");
    label.style.position = "absolute";
    label.style.top = `${y + 40}px`;
    label.style.right = "4px";
    label.style.fontSize = "10px";
    label.innerText = u === "in" ? (y / DPI).toFixed(0) : ((y / DPI) * 2.54).toFixed(0);
    rulerLeft.appendChild(label);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawRulers();
  for (const el of images) {
    ctx.drawImage(el.img, el.x, el.y, el.w, el.h);
    if (el === selected) {
      ctx.strokeStyle = "red";
      ctx.lineWidth = 4;
      ctx.strokeRect(el.x, el.y, el.w, el.h);
    }
  }
}

canvas.addEventListener("pointerdown", e => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  for (let i = images.length - 1; i >= 0; i--) {
    const el = images[i];
    if (x >= el.x && x <= el.x + el.w && y >= el.y && y <= el.y + el.h) {
      selected = el;
      offsetX = x - el.x;
      offsetY = y - el.y;
      dragging = true;
      draw();
      return;
    }
  }
  selected = null;
  draw();
});

canvas.addEventListener("pointermove", e => {
  if (!dragging || !selected) return;
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  selected.x = x - offsetX;
  selected.y = y - offsetY;
  draw();
});

canvas.addEventListener("pointerup", () => dragging = false);

function autoArrange() {
  let x = 50, y = 50, rowH = 0;
  for (const el of images) {
    if (x + el.w > canvas.width) {
      x = 50;
      y += rowH + 50;
      rowH = 0;
    }
    el.x = x;
    el.y = y;
    x += el.w + 50;
    rowH = Math.max(rowH, el.h);
  }
  draw();
}

function resizeSelected() {
  if (!selected) return alert("Select an image first.");
  const u = unitSelect.value;
  const input = prompt(`Enter new size in ${u} (width,height):`, "2,2");
  if (!input) return;
  const [w, h] = input.split(",").map(v => parseFloat(v.trim()));
  if (isNaN(w) || isNaN(h)) return alert("Invalid values.");
  selected.w = u === "in" ? w * DPI : (w / 2.54) * DPI;
  selected.h = u === "in" ? h * DPI : (h / 2.54) * DPI;
  draw();
}

function deleteSelected() {
  if (!selected) return;
  images = images.filter(img => img !== selected);
  selected = null;
  draw();
}

function clearCanvas() {
  if (!confirm("Clear all images?")) return;
  images = [];
  selected = null;
  draw();
}

function download() {
  const link = document.createElement("a");
  link.download = "DTF_Gangsheet_300dpi.png";
  canvas.toBlob(blob => {
    link.href = URL.createObjectURL(blob);
    link.click();
  }, "image/png");
}


let textElements = [];
let gridOn = false;

document.getElementById("gridToggle").addEventListener("change", e => {
  gridOn = e.target.checked;
  draw();
});

function addText() {
  const text = prompt("Enter text:");
  if (text) {
    textElements.push({ text, x: 100, y: 100 });
    draw();
  }
}

function drawText(ctx) {
  ctx.fillStyle = "black";
  ctx.font = "24px sans-serif";
  textElements.forEach(el => {
    ctx.fillText(el.text, el.x, el.y);
  });
}

function drawGrid(ctx) {
  if (!gridOn) return;
  const step = 150;
  ctx.strokeStyle = "#ddd";
  for (let x = 0; x < canvas.width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function rotateSelected() {
  if (!selected) return;
  selected.rotation = (selected.rotation || 0) + Math.PI / 2;
  draw();
}

function addTemplate(src) {
  const img = new Image();
  img.onload = () => {
    images.push({ img, x: 100, y: 100, w: img.width, h: img.height });
    draw();
  };
  img.src = src;
}

function downloadPDF() {
  const canvasData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [canvas.width * 0.24, canvas.height * 0.24] });
  pdf.addImage(canvasData, 'PNG', 0, 0, canvas.width * 0.24, canvas.height * 0.24);
  pdf.save("DTF_Gangsheet.pdf");
}

// Extend draw function
const originalDraw = draw;
draw = function() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawRulers();
  drawGrid(ctx);
  for (const el of images) {
    ctx.save();
    if (el.rotation) {
      ctx.translate(el.x + el.w/2, el.y + el.h/2);
      ctx.rotate(el.rotation);
      ctx.drawImage(el.img, -el.w/2, -el.h/2, el.w, el.h);
    } else {
      ctx.drawImage(el.img, el.x, el.y, el.w, el.h);
    }
    if (el === selected) {
      ctx.strokeStyle = "red";
      ctx.lineWidth = 4;
      ctx.strokeRect(el.x, el.y, el.w, el.h);
    }
    ctx.restore();
  }
  drawText(ctx);
};
