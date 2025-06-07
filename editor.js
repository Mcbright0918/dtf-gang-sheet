const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let elements = [];
let selected = null;
const DPI = 300;

canvas.addEventListener("mousedown", startDrag);
canvas.addEventListener("mousemove", drag);
canvas.addEventListener("mouseup", endDrag);
canvas.addEventListener("touchstart", startDrag, { passive: false });
canvas.addEventListener("touchmove", drag, { passive: false });
canvas.addEventListener("touchend", endDrag);

function getPos(e) {
  if (e.touches) e = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height)
  };
}

function startDrag(e) {
  e.preventDefault();
  const pos = getPos(e);
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];
    if (pos.x >= el.x && pos.x <= el.x + el.w && pos.y >= el.y && pos.y <= el.y + el.h) {
      selected = el;
      selected.offsetX = pos.x - el.x;
      selected.offsetY = pos.y - el.y;
      selected.dragging = true;
      draw();
      return;
    }
  }
  selected = null;
  draw();
}

function drag(e) {
  if (!selected || !selected.dragging) return;
  const pos = getPos(e);
  selected.x = pos.x - selected.offsetX;
  selected.y = pos.y - selected.offsetY;
  draw();
}

function endDrag() {
  if (selected) selected.dragging = false;
}

document.getElementById("upload").addEventListener("change", (e) => {
  for (const file of e.target.files) {
    const img = new Image();
    img.onload = () => {
      const w = img.width;
      const h = img.height;
      elements.push({ type: 'image', img, x: 100, y: 100, w, h });
      draw();
    };
    img.src = URL.createObjectURL(file);
  }
});

function addText() {
  const text = prompt("Enter text:");
  if (!text) return;
  ctx.font = "30px Arial";
  const width = ctx.measureText(text).width;
  elements.push({ type: 'text', text, x: 100, y: 100, w: width, h: 40 });
  draw();
}

function clearCanvas() {
  elements = [];
  selected = null;
  draw();
}

function deleteSelected() {
  if (!selected) return;
  elements = elements.filter(el => el !== selected);
  selected = null;
  draw();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const el of elements) {
    if (el.type === 'image') {
      ctx.drawImage(el.img, el.x, el.y, el.w, el.h);
    } else if (el.type === 'text') {
      ctx.font = "30px Arial";
      ctx.fillText(el.text, el.x, el.y + 30);
    }
    if (el === selected) {
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.strokeRect(el.x, el.y, el.w, el.h);
    }
  }
}

function resizeCanvas() {
  const w = parseFloat(document.getElementById("canvasW").value);
  const h = parseFloat(document.getElementById("canvasH").value);
  canvas.width = w * DPI;
  canvas.height = h * DPI;
  draw();
}

function downloadPNG() {
  const link = document.createElement('a');
  link.download = "gangsheet.png";
  canvas.toBlob(blob => {
    link.href = URL.createObjectURL(blob);
    link.click();
  }, 'image/png');
}

function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [canvas.width, canvas.height]
  });
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0);
  pdf.save('gangsheet.pdf');
}
