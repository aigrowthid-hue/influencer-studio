import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';

/**
 * Character sheets are generated as a 3x3 grid of the same person from 9 angles.
 * When that grid is fed directly to an image model as an identity reference,
 * the model often interprets it as 9 different people and loses face consistency.
 *
 * This util pulls the top-left panel (close-up front portrait) from the grid
 * and returns a clean single-portrait data URL that downstream models can
 * use as an unambiguous identity reference.
 */
export async function extractCharacterPortrait(characterSheetUrl: string): Promise<string> {
  if (!characterSheetUrl) throw new Error('extractCharacterPortrait: empty url');

  const buffer = await fetchImageBuffer(characterSheetUrl);
  const meta = await sharp(buffer).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (!width || !height) {
    // Couldn't read dimensions — return original as data URL so we still pass something.
    return bufferToDataUrl(buffer, meta.format);
  }

  // Heuristic: assume 3x3 grid. Crop top-left third.
  // Slight inset (5% padding) to avoid grid borders / labels bleeding in.
  const cellW = Math.floor(width / 3);
  const cellH = Math.floor(height / 3);
  const padX = Math.floor(cellW * 0.05);
  const padY = Math.floor(cellH * 0.05);

  const cropped = await sharp(buffer)
    .extract({
      left: padX,
      top: padY,
      width: Math.max(1, cellW - padX * 2),
      height: Math.max(1, cellH - padY * 2)
    })
    .jpeg({ quality: 92 })
    .toBuffer();

  return bufferToDataUrl(cropped, 'jpeg');
}

async function fetchImageBuffer(url: string): Promise<Buffer> {
  // Local /uploads/ path
  if (url.startsWith('/uploads/')) {
    const filePath = path.join(process.cwd(), 'public', url);
    return await fs.readFile(filePath);
  }

  // Data URL
  if (url.startsWith('data:')) {
    const base64 = url.split(',')[1] || '';
    return Buffer.from(base64, 'base64');
  }

  // Remote HTTP(S)
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch character sheet: ${res.status}`);
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}

function bufferToDataUrl(buffer: Buffer, format?: string): string {
  const mime = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
  return `data:${mime};base64,${buffer.toString('base64')}`;
}
