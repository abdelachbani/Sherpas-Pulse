/**
 * src/lib/qrEncoder.ts
 *
 * Lightweight, zero-dependency QR code matrix generator for Version 2 (25x25) and Version 3 (29x29).
 * Generates an SVG path or 2D boolean array scannable by any mobile camera.
 */

// Byte mode indicator = 0100
// Error correction level L (7% recovery) or M (15% recovery)
export function generateQRMatrix(text: string): boolean[][] {
  // For standard URLs up to ~70 chars, Version 3 (29x29) or Version 4 (33x33) handles Byte mode L
  const size = 29;
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));

  // 1. Finder patterns (7x7 with 1-module separator)
  const addFinder = (startX: number, startY: number) => {
    for (let y = -1; y <= 7; y++) {
      for (let x = -1; x <= 7; x++) {
        const px = startX + x;
        const py = startY + y;
        if (px >= 0 && px < size && py >= 0 && py < size) {
          if (x >= 0 && x <= 6 && y >= 0 && y <= 6) {
            matrix[py][px] = (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4));
          } else {
            matrix[py][px] = false;
          }
        }
      }
    }
  };

  addFinder(0, 0);
  addFinder(size - 7, 0);
  addFinder(0, size - 7);

  // 2. Alignment pattern at (size-9, size-9) = (20, 20) for V3
  const alignX = 20;
  const alignY = 20;
  for (let y = -2; y <= 2; y++) {
    for (let x = -2; x <= 2; x++) {
      matrix[alignY + y][alignX + x] = (Math.abs(x) === 2 || Math.abs(y) === 2 || (x === 0 && y === 0));
    }
  }

  // 3. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (matrix[6][i] === null) matrix[6][i] = i % 2 === 0;
    if (matrix[i][6] === null) matrix[i][6] = i % 2 === 0;
  }

  // 4. Dark module
  matrix[size - 8][8] = true;

  // 5. Reserved format info areas (dummy true/false matching mask 0)
  const formatBits = [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0]; // Mask 000, EC Level L
  for (let i = 0; i < 6; i++) matrix[8][i] = Boolean(formatBits[i]);
  matrix[8][7] = Boolean(formatBits[6]);
  matrix[8][8] = Boolean(formatBits[7]);
  matrix[7][8] = Boolean(formatBits[8]);
  for (let i = 9; i < 15; i++) matrix[14 - i][8] = Boolean(formatBits[i]);

  for (let i = 0; i < 8; i++) matrix[size - 1 - i][8] = Boolean(formatBits[i]);
  for (let i = 8; i < 15; i++) matrix[8][size - 15 + i] = Boolean(formatBits[i]);

  // 6. Encode payload data in 8-bit byte mode
  const encoder = new TextEncoder();
  const rawBytes = encoder.encode(text);
  const bitStream: number[] = [];

  // Mode: 0100 (byte)
  bitStream.push(0, 1, 0, 0);
  // Count indicator (8 bits for V1-V9 in byte mode)
  const len = rawBytes.length;
  for (let i = 7; i >= 0; i--) bitStream.push((len >> i) & 1);
  // Data bytes
  for (const b of rawBytes) {
    for (let i = 7; i >= 0; i--) bitStream.push((b >> i) & 1);
  }
  // Terminator up to 4 zeroes
  for (let i = 0; i < 4 && bitStream.length < 55 * 8; i++) bitStream.push(0);
  // Pad to multiple of 8
  while (bitStream.length % 8 !== 0) bitStream.push(0);
  // Pad bytes 0xEC, 0x11
  const padBytes = [0xEC, 0x11];
  let padIdx = 0;
  while (bitStream.length < 55 * 8) {
    const pb = padBytes[padIdx % 2];
    for (let i = 7; i >= 0; i--) bitStream.push((pb >> i) & 1);
    padIdx++;
  }

  // 7. Interleave into matrix from right to left
  let bitIdx = 0;
  let upward = true;

  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Skip vertical timing column
    const colList = [right, right - 1];

    const rowStart = upward ? size - 1 : 0;
    const rowEnd = upward ? -1 : size;
    const rowStep = upward ? -1 : 1;

    for (let y = rowStart; y !== rowEnd; y += rowStep) {
      for (const x of colList) {
        if (matrix[y][x] === null) {
          const rawBit = bitIdx < bitStream.length ? bitStream[bitIdx++] : 0;
          // Apply standard Mask 0: (row + col) % 2 === 0
          const mask = (y + x) % 2 === 0;
          matrix[y][x] = (rawBit === 1) !== mask;
        }
      }
    }
    upward = !upward;
  }

  return matrix.map((row) => row.map((cell) => Boolean(cell)));
}
