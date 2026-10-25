// Corner-based tile outlines: a square whose four corners are each cut,
// rounded or left square.

export const cut = (size) => ({ kind: "cut", size });
export const round = (size) => ({ kind: "round", size });
export const square = () => ({ kind: "round", size: 0 });

// Larger corners would eat into the glyph area.
const MAX_CORNER = 40;

// How much each corner shrinks per px of inset, so the bevel between the
// frame and the body stays an even width.
const SHRINK = { cut: 0.5, round: 0.8 };

// Corners are listed clockwise from top-left. `size` is measured on the
// outer frame (inset 2).
export const cornerShape = (corners) => {
  for (const corner of corners) {
    if (corner.size > MAX_CORNER) {
      throw new Error(`Corner size ${corner.size} exceeds ${MAX_CORNER}`);
    }
  }
  return (inset) => {
    const a = inset;
    const b = 128 - inset;
    const [tl, tr, br, bl] = corners.map((corner) => ({
      ...corner,
      s: Math.max(0, corner.size - (inset - 2) * SHRINK[corner.kind]),
    }));
    // For each corner: where the outline arrives, and where it leaves.
    const points = [
      [tr, [b - tr.s, a], [b, a + tr.s]],
      [br, [b, b - br.s], [b - br.s, b]],
      [bl, [a + bl.s, b], [a, b - bl.s]],
      [tl, [a, a + tl.s], [a + tl.s, a]],
    ];
    let d = `M${a + tl.s} ${a}`;
    for (const [corner, [ex, ey], [lx, ly]] of points) {
      d += ` L${ex} ${ey}`;
      if (corner.s === 0) continue;
      d +=
        corner.kind === "round"
          ? ` A${corner.s} ${corner.s} 0 0 1 ${lx} ${ly}`
          : ` L${lx} ${ly}`;
    }
    return `${d} Z`;
  };
};

const all = (corner) => [corner, corner, corner, corner];

// Every corner cut, like the HUD's angled panels.
export const chamfer4 = cornerShape(all(cut(15)));
// Top-left and bottom-right cut only, matching the UI buttons.
export const chamfer2 = cornerShape([cut(18), round(3), cut(18), round(3)]);
export const chamferSmall = cornerShape(all(cut(7)));
export const squareHard = cornerShape(all(round(2)));
export const squareSoft = cornerShape(all(round(6)));
export const rounded = cornerShape(all(round(18)));
