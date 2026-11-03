import type { ReactNode } from "react";
import { BookOpen } from "lucide-react";
import { useT } from "../../i18n";
import type { Messages } from "../../i18n/en";
import styles from "./Legend.module.css";

type Labels = Messages["legend"]["icons"];

type LegendItem = { key: string; icon: (labels: Labels) => ReactNode };

const items: readonly LegendItem[] = [
  {
    key: "literal",
    icon: (labels: Labels) => (
      <svg viewBox="0 0 64 28" aria-hidden="true">
        <path d="M0 14 H64" className={styles.track} />
        <rect x="14" y="3" width="36" height="22" rx="6" className={styles.station} />
        <text x="32" y="15">
          {labels.exact}
        </text>
      </svg>
    ),
  },
  {
    key: "class",
    icon: (labels: Labels) => (
      <svg viewBox="0 0 64 28" aria-hidden="true">
        <path d="M0 14 H64" className={styles.track} />
        <rect x="10" y="3" width="44" height="22" rx="6" className={styles.filled} />
        <text x="32" y="15" className={styles.filledText}>
          {labels.kind}
        </text>
      </svg>
    ),
  },
  {
    key: "anchor",
    icon: (labels: Labels) => (
      <svg viewBox="0 0 64 28" aria-hidden="true">
        <path d="M0 14 H64" className={styles.track} />
        <rect x="12" y="3" width="40" height="22" rx="11" className={styles.anchor} />
        <text x="32" y="15" className={styles.anchorText}>
          {labels.position}
        </text>
      </svg>
    ),
  },
  {
    key: "loop",
    icon: () => (
      <svg viewBox="0 0 64 28" aria-hidden="true">
        <path d="M0 9 H64" className={styles.track} />
        <path
          d="M44 9 a6 6 0 0 1 6 6 v1 a6 6 0 0 1 -6 6 H20 a6 6 0 0 1 -6 -6 v-1 a6 6 0 0 1 6 -6"
          className={styles.thin}
        />
        <rect x="20" y="2" width="24" height="14" rx="4" className={styles.station} />
      </svg>
    ),
  },
  {
    key: "skip",
    icon: () => (
      <svg viewBox="0 0 64 28" aria-hidden="true">
        <path d="M0 19 H64" className={styles.track} />
        <path
          d="M8 19 a6 6 0 0 0 6 -6 v-2 a6 6 0 0 1 6 -6 H44 a6 6 0 0 1 6 6 v2 a6 6 0 0 0 6 6"
          className={styles.thin}
        />
        <rect x="20" y="12" width="24" height="14" rx="4" className={styles.station} />
      </svg>
    ),
  },
  {
    key: "branch",
    icon: () => (
      <svg viewBox="0 0 64 28" aria-hidden="true">
        <path d="M0 8 H64" className={styles.track} />
        <path d="M4 8 C14 8 10 21 20 21 H44 C54 21 50 8 60 8" className={styles.track} />
        <rect x="22" y="2" width="20" height="12" rx="4" className={styles.station} />
        <rect x="22" y="15" width="20" height="12" rx="4" className={styles.station} />
      </svg>
    ),
  },
  {
    key: "group",
    icon: () => (
      <svg viewBox="0 0 64 28" aria-hidden="true">
        <rect x="6" y="1" width="52" height="26" rx="6" className={styles.frame} />
        <text x="14" y="8" className={styles.frameText}>
          #1
        </text>
        <path d="M6 18 H58" className={styles.track} />
        <rect x="22" y="11" width="20" height="14" rx="4" className={styles.station} />
      </svg>
    ),
  },
];

const toneKeys = ["ok", "fail", "back"] as const;

export function Legend() {
  const t = useT();
  return (
    <details className={styles.legend} open>
      <summary className={styles.summary}>
        <BookOpen size={16} aria-hidden="true" />
        {t.legend.title}
      </summary>
      <ul className={styles.items}>
        {items.map((item) => {
          const [title, text] = t.legend.items[item.key] ?? ["", ""];
          return (
            <li key={item.key} className={styles.item}>
              <span className={styles.icon}>{item.icon(t.legend.icons)}</span>
              <span>
                <strong>{title}</strong>
                <span className={styles.text}>{text}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className={styles.tones}>
        <span className={styles.toneLead}>{t.legend.turns}</span>
        {toneKeys.map((key) => {
          const [title, text] = t.legend.tones[key] ?? ["", ""];
          return (
            <span key={key} className={styles.tone} data-tone={key}>
              <span className={styles.swatch} aria-hidden="true" />
              <strong>{title}</strong> {text}
            </span>
          );
        })}
      </p>
    </details>
  );
}
