import sharp from 'sharp';

export type WatermarkPlacement =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'diagonal-single'
  | 'diagonal-tile';

export interface WatermarkOptions {
  text: string;
  placement: WatermarkPlacement;
  opacity: number;
  margin: number;
  fontSize: number;
  color: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizeHex = (color: string) => {
  const safe = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(safe)) return safe;
  if (/^#[0-9a-fA-F]{3}$/.test(safe)) {
    return `#${safe[1]}${safe[1]}${safe[2]}${safe[2]}${safe[3]}${safe[3]}`;
  }
  return '#cbc8c8';
};

const hexToRgb = (hex: string) => {
  const normalized = normalizeHex(hex).slice(1);
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
};

const escapeXml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const estimateTextWidth = (text: string, fontSize: number) => {
  return Array.from(text).reduce((sum, char) => {
    if (/^[\u0000-\u00ff]$/.test(char)) return sum + fontSize * 0.62;
    return sum + fontSize * 1.04;
  }, 0);
};

const resolveAngle = (placement: WatermarkPlacement) => {
  if (placement === 'diagonal-single' || placement === 'diagonal-tile') return 45;
  return 0;
};

const createTextSvg = ({
  text,
  fontSize,
  color,
  opacity,
  placement,
  maxWidth,
  maxHeight,
}: WatermarkOptions & { maxWidth: number; maxHeight: number }) => {
  const safeText = escapeXml(text || 'example');
  const rgb = hexToRgb(color);
  const angle = resolveAngle(placement);

  let resolvedFontSize = fontSize;
  let width = 0;
  let height = 0;
  let baseWidth = 0;
  let baseHeight = 0;

  for (let i = 0; i < 12; i += 1) {
    const estimatedWidth = estimateTextWidth(safeText, resolvedFontSize);
    const paddingX = angle === 0 ? Math.max(4, Math.round(resolvedFontSize * 0.12)) : Math.max(56, Math.round(resolvedFontSize * 1.8));
    const paddingY = angle === 0 ? Math.max(4, Math.round(resolvedFontSize * 0.1)) : Math.max(40, Math.round(resolvedFontSize * 1.25));
    const textWidth = Math.max(estimatedWidth, resolvedFontSize * 2);
    const textHeight = Math.max(resolvedFontSize * 1.4, 32);

    baseWidth = Math.round(textWidth + paddingX * 2);
    baseHeight = Math.round(textHeight + paddingY * 2);

    if (angle === 0) {
      width = baseWidth;
      height = baseHeight;
    } else {
      const radians = Math.PI / 4;
      const rotatedWidth = Math.abs(baseWidth * Math.cos(radians)) + Math.abs(baseHeight * Math.sin(radians));
      const rotatedHeight = Math.abs(baseWidth * Math.sin(radians)) + Math.abs(baseHeight * Math.cos(radians));
      width = Math.ceil(rotatedWidth + paddingX);
      height = Math.ceil(rotatedHeight + paddingY);
    }

    if (width <= maxWidth && height <= maxHeight) break;
    resolvedFontSize = Math.max(12, Math.floor(resolvedFontSize * 0.88));
  }

  width = Math.min(width, maxWidth);
  height = Math.min(height, maxHeight);

  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .label {
          font-family: "Noto Sans CJK KR", "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", "NanumGothic", Arial, sans-serif;
          font-size: ${resolvedFontSize}px;
          font-weight: 700;
          fill: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity});
        }
      </style>
      <g transform="translate(${width / 2} ${height / 2}) rotate(${angle}) translate(${-baseWidth / 2} ${-baseHeight / 2})">
        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" class="label">${safeText}</text>
      </g>
    </svg>`;

  return {
    input: Buffer.from(svg),
    width,
    height,
  };
};
export const parseOptions = (raw: Record<string, FormDataEntryValue | null>): WatermarkOptions => ({
  text: String(raw.text || 'example').slice(0, 120),
  placement: (
    raw.placement === 'top-left' ||
    raw.placement === 'top-right' ||
    raw.placement === 'bottom-left' ||
    raw.placement === 'bottom-right' ||
    raw.placement === 'diagonal-single' ||
    raw.placement === 'diagonal-tile'
      ? raw.placement
      : 'bottom-right'
  ) as WatermarkPlacement,
  opacity: clamp(Number(raw.opacity ?? 0.35) || 0.35, 0.05, 1),
  margin: clamp(Number(raw.margin ?? 24) || 24, 1, 200),
  fontSize: clamp(Number(raw.fontSize ?? 48) || 48, 12, 200),
  color: normalizeHex(String(raw.color || '#cbc8c8')),
});

const getCornerPlacement = (placement: WatermarkPlacement, width: number, height: number, stampWidth: number, stampHeight: number, margin: number) => {
  switch (placement) {
    case 'top-left':
      return { left: margin, top: margin };
    case 'top-right':
      return { left: Math.max(margin, width - stampWidth - margin), top: margin };
    case 'bottom-left':
      return { left: margin, top: Math.max(margin, height - stampHeight - margin) };
    case 'bottom-right':
    default:
      return {
        left: Math.max(margin, width - stampWidth - margin),
        top: Math.max(margin, height - stampHeight - margin),
      };
  }
};

export async function applyWatermark(imageBuffer: Buffer, options: WatermarkOptions) {
  const image = sharp(imageBuffer, { failOn: 'none' }).rotate();
  const metadata = await image.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  if (!width || !height) {
    throw new Error('유효하지 않은 이미지입니다.');
  }

  const base = image.ensureAlpha();
  const stamp = createTextSvg({
    ...options,
    maxWidth: Math.max(48, width),
    maxHeight: Math.max(48, height),
  });

  const composites =
    options.placement === 'diagonal-tile'
      ? (() => {
          const overlays: sharp.OverlayOptions[] = [];
          const stepX = stamp.width + options.margin * 2;
          const stepY = Math.max(Math.round(stamp.height * 0.9), stamp.height + options.margin);

          for (let y = -stamp.height; y < height + stamp.height; y += stepY) {
            const rowIndex = Math.round(y / stepY);
            const rowOffset = rowIndex % 2 === 0 ? 0 : Math.round(stepX / 2);
            for (let x = -stamp.width - rowOffset; x < width + stamp.width; x += stepX) {
              overlays.push({ input: stamp.input, left: Math.round(x), top: Math.round(y) });
            }
          }

          return overlays;
        })()
      : options.placement === 'diagonal-single'
        ? [
            {
              input: stamp.input,
              left: Math.round((width - stamp.width) / 2),
              top: Math.round((height - stamp.height) / 2),
            },
          ]
        : [
            {
              input: stamp.input,
              ...getCornerPlacement(options.placement, width, height, stamp.width, stamp.height, options.margin),
            },
          ];

  return base.composite(composites).png().toBuffer();
}
