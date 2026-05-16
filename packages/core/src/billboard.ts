import * as THREE from "three";

interface BillboardOpts {
  title: string;
  score: number | null;
  status: string;
  statusColor: string;
  dim?: boolean;
  killed?: number;
  survived?: number;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function makeBillboardSprite({
  title,
  score,
  status,
  statusColor,
  dim = false,
  killed,
  survived,
}: BillboardOpts): THREE.Sprite {
  const W = 1024, H = 608;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const FONT = '-apple-system, "SF Pro Display", "Inter", system-ui, sans-serif';

  // Frame
  const pad = 30;
  const fx = pad, fy = pad, fw = W - pad * 2, fh = H - pad * 2;
  const radius = 56;

  const baseGrad = ctx.createLinearGradient(0, fy, 0, fy + fh);
  baseGrad.addColorStop(0, "rgba(22, 28, 46, 0.97)");
  baseGrad.addColorStop(1, "rgba(8, 11, 22, 0.97)");
  ctx.fillStyle = baseGrad;
  roundRect(ctx, fx, fy, fw, fh, radius);
  ctx.fill();

  const topGlow = ctx.createLinearGradient(0, fy, 0, fy + 140);
  topGlow.addColorStop(0, statusColor + "2a");
  topGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = topGlow;
  roundRect(ctx, fx, fy, fw, 140, radius);
  ctx.fill();

  ctx.strokeStyle = statusColor + "7a";
  ctx.lineWidth = 4;
  roundRect(ctx, fx + 2, fy + 2, fw - 4, fh - 4, radius - 2);
  ctx.stroke();

  // Title
  ctx.fillStyle = "#f4f6ff";
  ctx.font = `600 76px ${FONT}`;
  ctx.letterSpacing = "4px";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(title.toUpperCase(), W / 2 + 2, 78);
  ctx.letterSpacing = "0px";

  const dividerW = 96;
  ctx.fillStyle = statusColor;
  ctx.globalAlpha = 0.9;
  roundRect(ctx, W / 2 - dividerW / 2, 192, dividerW, 4, 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Big score
  const scoreText = score == null ? "—" : Math.round(score).toString();
  const SCORE_NUM_PX = 232;
  const SCORE_PCT_PX = 92;
  const SCORE_BASE_Y = H / 2 + 116;
  const gap = 14;

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  ctx.font = `700 ${SCORE_NUM_PX}px ${FONT}`;
  const scoreW = ctx.measureText(scoreText).width;
  ctx.font = `600 ${SCORE_PCT_PX}px ${FONT}`;
  const pctW = ctx.measureText("%").width;

  const totalW = scoreW + gap + pctW;
  const startX = W / 2 - totalW / 2;

  const glow = ctx.createRadialGradient(
    W / 2, SCORE_BASE_Y - SCORE_NUM_PX * 0.35, 0,
    W / 2, SCORE_BASE_Y - SCORE_NUM_PX * 0.35, totalW / 1.2
  );
  glow.addColorStop(0, statusColor + (dim ? "00" : "22"));
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, SCORE_BASE_Y - SCORE_NUM_PX, W, SCORE_NUM_PX);

  ctx.fillStyle = dim ? "#5c6370" : statusColor;
  ctx.font = `700 ${SCORE_NUM_PX}px ${FONT}`;
  ctx.fillText(scoreText, startX, SCORE_BASE_Y);

  ctx.fillStyle = dim ? "#5c6370" : statusColor + "cc";
  ctx.font = `600 ${SCORE_PCT_PX}px ${FONT}`;
  ctx.fillText("%", startX + scoreW + gap, SCORE_BASE_Y);

  // Caught / Missed sub-line
  if (killed != null && survived != null) {
    ctx.fillStyle = "#7a8095";
    ctx.font = `500 28px ${FONT}`;
    ctx.letterSpacing = "4px";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(`${killed} CAUGHT  ·  ${survived} MISSED`, W / 2, SCORE_BASE_Y + 12);
    ctx.letterSpacing = "0px";
  }

  // Status pill (bottom)
  const upper = status.toUpperCase();
  ctx.font = `600 36px ${FONT}`;
  ctx.letterSpacing = "4px";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const pillTextW = ctx.measureText(upper).width;
  const pillW = pillTextW + 70;
  const pillH = 60;
  const pillX = W / 2 - pillW / 2;
  const pillY = H - 132;

  ctx.fillStyle = statusColor + "26";
  roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.strokeStyle = statusColor;
  ctx.lineWidth = 2.5;
  roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.stroke();
  ctx.fillStyle = statusColor;
  ctx.fillText(upper, W / 2, pillY + pillH / 2 + 1);
  ctx.letterSpacing = "0px";

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 16;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  sprite.scale.set(64, 38, 1);
  return sprite;
}

/**
 * Service "sun" — a single camera-facing sprite that bakes the white
 * disc, the symbol (initials of the displayName, max 3 chars), and the
 * full service name into one texture. Drawing the sun as a sprite
 * (rather than a 3D sphere with a label child) sidesteps transparent-
 * pass sorting that buries an inner sprite behind its own enclosing
 * sphere, and guarantees the label is always readable straight-on.
 */
export function makeServiceSunSprite(icon: string, name: string): THREE.Sprite {
  const W = 512, H = 512;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const FONT = '-apple-system, "SF Pro Display", "Inter", system-ui, sans-serif';
  // Emoji fonts must come first so the OS picks a colour glyph instead of
  // a monochrome text fallback. Canvas honours the first family that has
  // a glyph for the given codepoint.
  const ICON_FONT =
    '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif';

  const cx = W / 2, cy = H / 2;
  const sunR = 230;

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(cx, cy, sunR, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,210,120,0.9)";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, sunR - 4, 0, Math.PI * 2);
  ctx.stroke();

  ctx.font = `220px ${ICON_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(icon, cx, cy - 30);

  ctx.font = `700 38px ${FONT}`;
  ctx.fillStyle = "#0a0c14";
  ctx.textBaseline = "top";

  const upper = name.toUpperCase();
  const maxLineW = sunR * 1.55;
  const words = upper.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const next = current ? `${current} ${w}` : w;
    if (ctx.measureText(next).width <= maxLineW) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);

  const lineH = 44;
  const baseY = cy + 60;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], cx, baseY + i * lineH);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 16;
  tex.needsUpdate = true;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    })
  );
  sprite.scale.set(54, 54, 1);
  sprite.renderOrder = 1000;
  sprite.frustumCulled = false;
  return sprite;
}
