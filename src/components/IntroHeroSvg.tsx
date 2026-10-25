import React from "react";

/**
 * Hero shapes: 3 rings per side, each in its OWN small SVG so the browser can
 * promote it to a GPU layer and move it with a transform only (no repaint per
 * scroll frame). The shapes are plain <path>s (the nested clipPaths of the
 * previous version are gone - they were the expensive part).
 *
 * Layout is driven by three CSS variables that useHeroScroll() keeps in sync
 * with the card, so the rings stay glued to the card on every screen size:
 *   --k   px per art unit        --cl  card's left edge in px (gutter)
 *   --cy  vertical centre in px
 *
 * Art units = the coordinate system of the original SVG (1024 x 576).
 */

/** card's left edge and the vertical centre line, in art units (same as heroMotion.ts) */
const XC = 358.575;
const CY = 288;
const ART_W = 1024;

interface RingDef {
  key: string;
  side: "l" | "r";
  /** bounding box [x0, y0, x1, y1] of black + white piece, in this side's art units */
  box: [number, number, number, number];
  black: string;
  white: string;
}

const RING_DEFS: RingDef[] = [
  {
    key: "l1",
    side: "l",
    box: [145.613, 133.047, 323.082, 442.945],
    black: "M 169.453125 288.65625 L 169.453125 133.046875 C 255.828125 136.34375 323.082031 204.257812 323.082031 288.65625 C 323.082031 372.394531 255.828125 440.964844 169.453125 442.945312 L 169.453125 287.335938 Z",
    white: "M 145.613281 288.566406 L 145.613281 154.84375 C 219.839844 157.675781 277.632812 216.039062 277.632812 288.566406 C 277.632812 360.523438 219.839844 419.453125 145.613281 421.152344 L 145.613281 287.429688 Z",
  },
  {
    key: "l2",
    side: "l",
    box: [49.289, 133.047, 169.453, 442.945],
    black: "M 169.453125 293.929688 L 169.453125 292.613281 C 169.453125 333.492188 152.308594 371.074219 133.1875 398.109375 C 114.066406 424.480469 88.351562 441.625 57.363281 442.945312 L 57.363281 133.046875 C 88.351562 135.683594 114.066406 152.167969 133.1875 178.542969 C 152.308594 205.578125 169.453125 243.160156 169.453125 284.699219 Z",
    white: "M 145.613281 293.097656 L 145.613281 291.964844 C 145.613281 327.09375 130.878906 359.390625 114.449219 382.621094 C 98.015625 405.289062 75.917969 420.019531 49.289062 421.152344 L 49.289062 154.84375 C 75.917969 157.109375 98.015625 171.273438 114.449219 193.941406 C 130.878906 217.171875 145.613281 249.46875 145.613281 285.164062 Z",
  },
  {
    key: "l3",
    side: "l",
    box: [-0.008, 133.047, 57.363, 442.285],
    black: "M 57.363281 288.65625 C 57.363281 331.511719 46.152344 371.074219 34.945312 398.765625 C 29.007812 412.613281 22.414062 423.824219 15.164062 431.734375 C 9.230469 437.667969 3.292969 441.625 -0.00390625 442.285156 L -0.00390625 133.046875 C 3.292969 135.683594 11.207031 138.980469 15.164062 145.574219 C 22.414062 152.828125 29.007812 164.039062 34.945312 177.882812 C 45.492188 204.257812 57.363281 240.523438 57.363281 280.082031 Z",
    white: "M 49.289062 288.566406 C 49.289062 325.394531 39.65625 359.390625 30.023438 383.191406 C 24.921875 395.089844 19.257812 404.722656 13.023438 411.519531 C 7.925781 416.621094 2.824219 420.019531 -0.0078125 420.585938 L -0.0078125 154.84375 C 2.824219 157.109375 9.625 159.941406 13.023438 165.609375 C 19.257812 171.839844 24.921875 181.472656 30.023438 193.375 C 39.089844 216.039062 49.289062 247.203125 49.289062 281.199219 Z",
  },
  {
    key: "r1",
    side: "r",
    box: [700.918, 133.051, 878.379, 442.949],
    black: "M 854.546875 287.339844 L 854.546875 442.949219 C 768.171875 439.652344 700.917969 371.738281 700.917969 287.339844 C 700.917969 203.601562 768.171875 135.03125 854.546875 133.050781 L 854.546875 288.660156 Z",
    white: "M 878.378906 287.433594 L 878.378906 421.15625 C 804.152344 418.320312 746.359375 359.960938 746.359375 287.433594 C 746.359375 215.472656 804.152344 156.546875 878.378906 154.84375 L 878.378906 288.566406 Z",
  },
  {
    key: "r2",
    side: "r",
    box: [854.547, 133.051, 974.703, 442.949],
    black: "M 854.546875 282.066406 L 854.546875 283.382812 C 854.546875 242.503906 871.691406 204.921875 890.8125 177.886719 C 909.933594 151.515625 935.648438 134.371094 966.636719 133.050781 L 966.636719 442.949219 C 935.648438 440.308594 909.933594 423.828125 890.8125 397.453125 C 871.691406 370.417969 854.546875 332.835938 854.546875 291.296875 Z",
    white: "M 878.378906 282.902344 L 878.378906 284.035156 C 878.378906 248.902344 893.113281 216.605469 909.542969 193.375 C 925.976562 170.710938 948.074219 155.976562 974.703125 154.84375 L 974.703125 421.15625 C 948.074219 418.886719 925.976562 404.722656 909.542969 382.058594 C 893.113281 358.828125 878.378906 326.53125 878.378906 290.832031 Z",
  },
  {
    key: "r3",
    side: "r",
    box: [966.637, 133.711, 1024.000, 442.949],
    black: "M 966.636719 287.339844 C 966.636719 244.484375 977.84375 204.921875 989.054688 177.230469 C 994.988281 163.382812 1001.582031 152.171875 1008.835938 144.261719 C 1014.769531 138.328125 1020.703125 134.371094 1024 133.710938 L 1024 442.949219 C 1020.703125 440.308594 1012.792969 437.015625 1008.835938 430.421875 C 1001.582031 423.167969 994.988281 411.957031 989.054688 398.113281 C 978.503906 371.738281 966.636719 335.472656 966.636719 295.914062 Z",
    white: "M 974.703125 287.433594 C 974.703125 250.601562 984.335938 216.605469 993.96875 192.808594 C 999.070312 180.910156 1004.734375 171.277344 1010.96875 164.476562 C 1016.066406 159.378906 1021.167969 155.976562 1024 155.410156 L 1024 421.15625 C 1021.167969 418.886719 1014.367188 416.054688 1010.96875 410.390625 C 1004.734375 404.15625 999.070312 394.523438 993.96875 382.625 C 984.902344 359.960938 974.703125 328.796875 974.703125 294.800781 Z",
  },
];

const px = (n: number) => `${n.toFixed(3)}px`;

function ringStyle(r: RingDef): React.CSSProperties {
  const [x0, y0, x1, y1] = r.box;
  // right-hand art is an exact mirror of the left, so it is anchored from the right edge
  const edge = r.side === "l" ? x0 - XC : ART_W - x1 - XC;
  return {
    [r.side === "l" ? "left" : "right"]: `calc(var(--cl) + ${px(edge)} * var(--k))`,
    top: `calc(var(--cy) + ${px(y0 - CY)} * var(--k))`,
    width: `calc(${px(x1 - x0)} * var(--k))`,
    height: `calc(${px(y1 - y0)} * var(--k))`,
  };
}

/** the liquid bridge lives in a small SVG over the card's edge (art units: 120 wide, 400 tall) */
const BR = { x: -80, w: 120, h: 400 };

function bridgeStyle(side: "l" | "r"): React.CSSProperties {
  return {
    [side === "l" ? "left" : "right"]: `calc(var(--cl) + ${px(BR.x)} * var(--k))`,
    top: `calc(var(--cy) + ${px(-BR.h / 2)} * var(--k))`,
    width: `calc(${px(BR.w)} * var(--k))`,
    height: `calc(${px(BR.h)} * var(--k))`,
  };
}

function Side({ side }: { side: "l" | "r" }) {
  return (
    <div className={`hero-side hero-side-${side === "l" ? "left" : "right"}`}>
      {/* liquid bridge: under the rings and under the card, so only the neck shows */}
      <svg
        className={`hero-bridge hero-bridge-${side === "l" ? "left" : "right"}`}
        style={bridgeStyle(side)}
        viewBox={`${XC + BR.x} ${CY - BR.h / 2} ${BR.w} ${BR.h}`}
        preserveAspectRatio="none"
        focusable="false"
      >
        {[1, 2, 3].map((n) => (
          <path key={n} data-bridge={`${side}${n}`} className="hero-shape-black" d="" />
        ))}
      </svg>

      {RING_DEFS.filter((r) => r.side === side).map((r) => (
        <svg
          key={r.key}
          data-ring={r.key}
          className="hero-ring"
          style={ringStyle(r)}
          viewBox={`${r.box[0]} ${r.box[1]} ${r.box[2] - r.box[0]} ${r.box[3] - r.box[1]}`}
          preserveAspectRatio="none"
          focusable="false"
        >
          <path className="hero-shape-black" d={r.black} />
          <path className="hero-shape-white" d={r.white} />
        </svg>
      ))}
    </div>
  );
}

function IntroHeroSvgImpl() {
  return (
    <div className="hero-stage" aria-hidden="true">
      <Side side="l" />
      <Side side="r" />
    </div>
  );
}

/** memo: parent re-renders (intro finished etc.) must never touch these DOM nodes */
export const IntroHeroSvg = React.memo(IntroHeroSvgImpl);
export default IntroHeroSvg;