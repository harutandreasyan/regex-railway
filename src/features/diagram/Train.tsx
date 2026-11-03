import type { Point } from "../../engine/layout";
import { STATION_HEIGHT } from "../../engine/layout";
import type { Tone } from "../debugger/train";
import styles from "./Train.module.css";

const LIFT = STATION_HEIGHT / 2 + 12;

export function Train({ point, tone, step }: { point: Point; tone: Tone; step: number }) {
  return (
    <g className={styles.x} style={{ transform: `translateX(${point.x}px)` }} aria-hidden="true">
      <g className={styles.y} style={{ transform: `translateY(${point.y - LIFT}px)` }}>
        <g key={step} className={styles.hop} data-tone={tone}>
          <g className={styles.bob}>
            <ellipse cx={0} cy={13} rx={18} ry={3} className={styles.shadow} />
            <rect x={-19} y={-10} width={38} height={20} rx={7} className={styles.body} />
            <rect x={-14} y={-6} width={9} height={7} rx={2} className={styles.window} />
            <rect x={-3} y={-6} width={9} height={7} rx={2} className={styles.window} />
            <path d="M 9 -6 h 5 a 3 3 0 0 1 3 3 v 4 h -8 z" className={styles.window} />
            <circle cx={-11} cy={10} r={3} className={styles.wheel} />
            <circle cx={11} cy={10} r={3} className={styles.wheel} />
            <circle cx={17} cy={5} r={2} className={styles.lamp} />
          </g>
        </g>
      </g>
    </g>
  );
}
