/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const publicDir = path.join(process.cwd(), 'public');
const iconsDir = path.join(publicDir, 'icons');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

// 1. Generate crisp SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#090d14" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="emerald" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399" />
      <stop offset="50%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <linearGradient id="cyan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background with rounded corners -->
  <rect width="512" height="512" rx="112" fill="url(#bg)" stroke="rgba(255,255,255,0.12)" stroke-width="4" />

  <!-- Outer hexagonal / tech ring -->
  <circle cx="256" cy="256" r="185" fill="none" stroke="rgba(16,185,129,0.18)" stroke-width="6" stroke-dasharray="16 8" />
  <circle cx="256" cy="256" r="160" fill="none" stroke="rgba(56,189,248,0.15)" stroke-width="3" />

  <!-- Center dumbbell / barbell icon with glow -->
  <g filter="url(#glow)">
    <!-- Barbell Shaft -->
    <rect x="136" y="240" width="240" height="32" rx="16" fill="url(#emerald)" />

    <!-- Left Plate Outer -->
    <rect x="168" y="156" width="32" height="200" rx="12" fill="url(#emerald)" />
    <rect x="136" y="186" width="24" height="140" rx="10" fill="url(#cyan)" />
    <rect x="112" y="206" width="18" height="100" rx="8" fill="#34d399" opacity="0.8" />

    <!-- Right Plate Outer -->
    <rect x="312" y="156" width="32" height="200" rx="12" fill="url(#emerald)" />
    <rect x="352" y="186" width="24" height="140" rx="10" fill="url(#cyan)" />
    <rect x="382" y="206" width="18" height="100" rx="8" fill="#34d399" opacity="0.8" />

    <!-- Knurling texture on center bar -->
    <line x1="236" y1="244" x2="236" y2="268" stroke="#090d14" stroke-width="3" stroke-linecap="round" />
    <line x1="246" y1="244" x2="246" y2="268" stroke="#090d14" stroke-width="3" stroke-linecap="round" />
    <line x1="256" y1="244" x2="256" y2="268" stroke="#090d14" stroke-width="3" stroke-linecap="round" />
    <line x1="266" y1="244" x2="266" y2="268" stroke="#090d14" stroke-width="3" stroke-linecap="round" />
    <line x1="276" y1="244" x2="276" y2="268" stroke="#090d14" stroke-width="3" stroke-linecap="round" />
  </g>

  <!-- Accent Pulse Dot -->
  <circle cx="256" cy="96" r="8" fill="#10b981" filter="url(#glow)" />
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent);
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);

// 2. Generate PNG images for 192x192, 512x512 and 180x180
function createPng(width, height, getPixel) {
  const rowLen = width * 4 + 1;
  const raw = Buffer.alloc(height * rowLen);
  for (let y = 0; y < height; y++) {
    raw[y * rowLen] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y);
      const off = y * rowLen + 1 + x * 4;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
      raw[off + 3] = a;
    }
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });
  
  function crc32(buf) {
    let table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
      table[i] = c;
    }
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

function renderIcon(size) {
  const radius = size * 0.22;
  const cx = size / 2;
  const cy = size / 2;

  return createPng(size, size, (x, y) => {
    // Check rounded rect boundary
    const dx = Math.max(Math.abs(x - cx) - (cx - radius), 0);
    const dy = Math.max(Math.abs(y - cy) - (cy - radius), 0);
    const distCorner = Math.sqrt(dx * dx + dy * dy);
    if (distCorner > radius) {
      return [0, 0, 0, 0]; // Transparent outside rounded corner
    }

    // Normalized coordinates (-1 to 1)
    const nx = (x - cx) / cx;
    const ny = (y - cy) / cy;
    const rDist = Math.sqrt(nx * nx + ny * ny);

    // Dark sleek background with subtle gradient
    let r = 9 + Math.floor((1 - ny) * 6);
    let g = 13 + Math.floor((1 - ny) * 10);
    let b = 20 + Math.floor((1 - ny) * 15);
    let a = 255;

    // Glowing circle tech ring around barbell
    if (Math.abs(rDist - 0.72) < 0.02) {
      r = 16; g = 185; b = 129;
    }

    // Dumbbell drawing
    // Center bar: ny in [-0.07, 0.07], nx in [-0.55, 0.55]
    if (Math.abs(ny) <= 0.07 && Math.abs(nx) <= 0.55) {
      r = 16; g = 200; b = 140;
    }

    // Inner main plates: nx in [-0.38, -0.26] or [0.26, 0.38], ny in [-0.42, 0.42]
    if ((Math.abs(nx) >= 0.26 && Math.abs(nx) <= 0.38) && Math.abs(ny) <= 0.42) {
      r = 16; g = 185; b = 129;
    }

    // Outer second plates: nx in [-0.50, -0.40] or [0.40, 0.50], ny in [-0.30, 0.30]
    if ((Math.abs(nx) >= 0.40 && Math.abs(nx) <= 0.50) && Math.abs(ny) <= 0.30) {
      r = 56; g = 189; b = 248;
    }

    // Collar / stopper: nx in [-0.23, -0.19] or [0.19, 0.23], ny in [-0.15, 0.15]
    if ((Math.abs(nx) >= 0.19 && Math.abs(nx) <= 0.23) && Math.abs(ny) <= 0.15) {
      r = 52; g = 211; b = 153;
    }

    // Accent top dot
    const dotDist = Math.sqrt(nx * nx + (ny + 0.65) * (ny + 0.65));
    if (dotDist <= 0.04) {
      r = 52; g = 211; b = 153;
    }

    return [r, g, b, a];
  });
}

fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), renderIcon(192));
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), renderIcon(512));
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), renderIcon(180));
console.log('Icons generated successfully in public/icons/');
