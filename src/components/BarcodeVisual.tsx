import React from 'react';

interface BarcodeVisualProps {
  code: string;
  className?: string;
  height?: number;
  showText?: boolean;
}

/**
 * High-definition vector SVG barcode generator.
 * Produces authentic looking barcode patterns with guard bars,
 * distinct variable-width bars and spacing, and clean human-readable text.
 */
export const BarcodeVisual: React.FC<BarcodeVisualProps> = ({
  code,
  className = '',
  height = 54,
  showText = true,
}) => {
  // Generate deterministic bar widths from string
  const cleanCode = code.replace(/[^a-zA-Z0-9]/g, '') || '8492019482';
  
  // Deterministic bar pattern based on char codes
  const bars: { width: number; isSpace: boolean }[] = [];
  
  // Guard bars at start
  bars.push({ width: 2, isSpace: false });
  bars.push({ width: 1, isSpace: true });
  bars.push({ width: 2, isSpace: false });
  bars.push({ width: 2, isSpace: true });

  for (let i = 0; i < cleanCode.length; i++) {
    const charCode = cleanCode.charCodeAt(i);
    const patternVal = (charCode * 7 + i * 13) % 16;
    
    // 4 bars per character
    const w1 = (patternVal % 3) + 1;
    const s1 = ((patternVal >> 1) % 2) + 1;
    const w2 = ((patternVal >> 2) % 3) + 1;
    const s2 = ((patternVal >> 3) % 2) + 1;

    bars.push({ width: w1, isSpace: false });
    bars.push({ width: s1, isSpace: true });
    bars.push({ width: w2, isSpace: false });
    bars.push({ width: s2, isSpace: true });
  }

  // Guard bars at end
  bars.push({ width: 2, isSpace: false });
  bars.push({ width: 1, isSpace: true });
  bars.push({ width: 3, isSpace: false });

  // Calculate total width
  let totalWidth = 0;
  bars.forEach((b) => {
    totalWidth += b.width * 2;
  });

  // Render SVG elements
  let currentX = 0;
  const rects: React.ReactNode[] = [];
  bars.forEach((b, idx) => {
    const barW = b.width * 2;
    if (!b.isSpace) {
      rects.push(
        <rect
          key={idx}
          x={currentX}
          y={0}
          width={barW}
          height={height}
          fill="currentColor"
        />
      );
    }
    currentX += barW;
  });

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="w-full max-w-full"
        style={{ height: `${height}px` }}
        preserveAspectRatio="none"
      >
        {rects}
      </svg>
      {showText && (
        <span className="font-mono text-[11px] tracking-[0.25em] font-semibold mt-1 text-inherit">
          *{code}*
        </span>
      )}
    </div>
  );
};

interface QrCodeVisualProps {
  value: string;
  size?: number;
  className?: string;
}

/**
 * Vector SVG QR Code with 3 authentic Finder Patterns (top-left, top-right, bottom-left)
 * and data grid generated deterministically from the payload.
 */
export const QrCodeVisual: React.FC<QrCodeVisualProps> = ({
  value,
  size = 110,
  className = '',
}) => {
  const gridSize = 21; // standard Version 1 QR code size (21x21 modules)
  const modules: boolean[][] = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(false)
  );

  // Helper to mark a finder pattern
  const markFinderPattern = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          modules[startY + r][startX + c] = true;
        }
      }
    }
  };

  // Top-left finder
  markFinderPattern(0, 0);
  // Top-right finder
  markFinderPattern(gridSize - 7, 0);
  // Bottom-left finder
  markFinderPattern(0, gridSize - 7);

  // Timing patterns
  for (let i = 8; i < gridSize - 8; i++) {
    modules[6][i] = i % 2 === 0;
    modules[i][6] = i % 2 === 0;
  }

  // Populate data modules deterministically
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Don't overwrite finders
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= gridSize - 8;
      const inBottomLeft = r >= gridSize - 8 && c < 8;
      const inTiming = (r === 6 && c >= 8 && c < gridSize - 8) || (c === 6 && r >= 8 && r < gridSize - 8);

      if (!inTopLeft && !inTopRight && !inBottomLeft && !inTiming) {
        const bit = ((hash ^ (r * 19 + c * 37)) >> ((r + c) % 16)) & 1;
        modules[r][c] = bit === 1;
      }
    }
  }

  const cellSize = 100 / gridSize;

  return (
    <div
      className={`inline-block p-2 bg-white rounded-lg border border-slate-200 shadow-sm ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full text-slate-900"
        shapeRendering="crispEdges"
      >
        {modules.flatMap((row, r) =>
          row.map((filled, c) =>
            filled ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize}
                height={cellSize}
                fill="currentColor"
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
};
