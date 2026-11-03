import type { CSSProperties } from "react";
import type { Point } from "../../engine/layout";
import styles from "./Burst.module.css";

const PARTICLES = 14;
const LANES = 7;

export function Burst({ at }: { at: Point }) {
  return (
    <g className={styles.burst} aria-hidden="true">
      <circle cx={at.x} cy={at.y} r={10} className={styles.ring} />
      {Array.from({ length: PARTICLES }, (_, index) => {
        const angle = (index / PARTICLES) * Math.PI * 2;
        const distance = 26 + (index % 3) * 10;
        return (
          <circle
            key={index}
            cx={at.x}
            cy={at.y}
            r={index % 2 === 0 ? 3.5 : 2.5}
            className={styles.particle}
            style={
              {
                "--dx": `${Math.cos(angle) * distance}px`,
                "--dy": `${Math.sin(angle) * distance}px`,
                fill: `var(--lane-${index % LANES})`,
              } as CSSProperties
            }
          />
        );
      })}
    </g>
  );
}
