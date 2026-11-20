/**
 * Client-side studio photo processor for user-uploaded garments.
 * Resizes images cleanly into a 3:4 portrait frame and optionally replaces
 * uniform outer backgrounds with Closet Index's neutral studio stone (#EFEFED).
 */
export async function processGarmentPhoto(
  file: File,
  options: { cleanBackdrop: boolean }
): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);

  const targetW = 600;
  const targetH = 800;
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;

  // Fill uniform studio backdrop
  ctx.fillStyle = '#EFEFED';
  ctx.fillRect(0, 0, targetW, targetH);

  // Fit image inside frame with 8% breathing room
  const padX = targetW * 0.08;
  const padY = targetH * 0.08;
  const availW = targetW - padX * 2;
  const availH = targetH - padY * 2;
  const scale = Math.min(availW / img.width, availH / img.height);
  const drawW = Math.round(img.width * scale);
  const drawH = Math.round(img.height * scale);
  const offsetX = Math.round((targetW - drawW) / 2);
  const offsetY = Math.round((targetH - drawH) / 2);

  if (options.cleanBackdrop) {
    // Draw onto temporary canvas to detect and clean uniform edge background
    const temp = document.createElement('canvas');
    temp.width = drawW;
    temp.height = drawH;
    const tCtx = temp.getContext('2d');
    if (tCtx) {
      tCtx.drawImage(img, 0, 0, drawW, drawH);
      const imgData = tCtx.getImageData(0, 0, drawW, drawH);
      stripEdgeBackground(imgData, drawW, drawH);
      tCtx.putImageData(imgData, 0, 0);
      ctx.drawImage(temp, offsetX, offsetY);
      return canvas.toDataURL('image/jpeg', 0.88);
    }
  }

  ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
  return canvas.toDataURL('image/jpeg', 0.88);
}

function stripEdgeBackground(imgData: ImageData, width: number, height: number): void {
  const data = imgData.data;
  // Sample 4 corners to estimate backdrop color
  const sampleCoords = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  for (const [x, y] of sampleCoords) {
    const idx = (y * width + x) * 4;
    rSum += data[idx];
    gSum += data[idx + 1];
    bSum += data[idx + 2];
  }
  const bgR = rSum / 4;
  const bgG = gSum / 4;
  const bgB = bSum / 4;

  // BFS flood-fill from borders to remove connected uniform background pixels
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  const tolerance = 38;
  const matchesBg = (idx: number): boolean => {
    const dr = Math.abs(data[idx] - bgR);
    const dg = Math.abs(data[idx + 1] - bgG);
    const db = Math.abs(data[idx + 2] - bgB);
    return dr + dg + db < tolerance * 3;
  };

  const enqueue = (x: number, y: number) => {
    const pos = y * width + x;
    if (visited[pos]) return;
    if (!matchesBg(pos * 4)) return;
    visited[pos] = 1;
    queue[tail++] = pos;
  };

  for (let x = 0; x < width; x++) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  while (head < tail) {
    const pos = queue[head++];
    const idx = pos * 4;
    data[idx] = 239;
    data[idx + 1] = 239;
    data[idx + 2] = 237;
    data[idx + 3] = 0;

    const x = pos % width;
    const y = (pos - x) / width;
    if (x > 0) enqueue(x - 1, y);
    if (x < width - 1) enqueue(x + 1, y);
    if (y > 0) enqueue(x, y - 1);
    if (y < height - 1) enqueue(x, y + 1);
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read photo file.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Invalid image file.'));
    img.src = src;
  });
}
