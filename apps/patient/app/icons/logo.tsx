import { ImageResponse } from "next/og";

/**
 * PLACEHOLDER logo (decisions-and-gaps G6): yellow tile with an ink cross, from the style sheet colours.
 * Replace with the final logo on Day 14. Keep app/icon.svg in step with this.
 */
export function logoResponse(size: number, fullBleed: boolean): ImageResponse {
  // Maskable and Apple icons are cropped by the system, so they fill the square and keep the cross in the safe zone.
  const cross = fullBleed ? 0.5 : 0.6;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: fullBleed ? "#F0DC82" : "transparent",
        }}
      >
        <svg width={size} height={size} viewBox="0 0 100 100">
          {!fullBleed && <rect x="0" y="0" width="100" height="100" rx="22" fill="#F0DC82" />}
          <g transform={`translate(50 50) scale(${cross}) translate(-50 -50)`}>
            <path d="M36 8h28v28h28v28H64v28H36V64H8V36h28z" fill="#1F1F1B" />
          </g>
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
