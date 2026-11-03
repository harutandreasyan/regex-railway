import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { Check, Flag, TrainFront } from "lucide-react";
import { useAnalysisValue } from "../../app/AnalysisContext";
import { useRailway } from "../../app/store";
import { trainAt } from "../debugger/train";
import { buildRows } from "./rows";
import { useT } from "../../i18n";
import styles from "./LineView.module.css";

const LANES = 7;

export function LineView() {
  const scroller = useRef<HTMLOListElement>(null);
  const { analysis, pattern, flags, phrases } = useAnalysisValue();
  const t = useT();
  const step = useRailway((state) => state.step);
  const focus = useRailway((state) => state.focus);
  const setFocus = useRailway((state) => state.setFocus);
  const rows = useMemo(
    () => (analysis.ok ? buildRows(analysis.parsed, pattern, flags, phrases) : []),
    [analysis, pattern, flags, phrases],
  );
  const train = analysis.ok ? trainAt(analysis, step) : null;
  const atEnd = train?.tone === "match";
  const atStart = !atEnd && train?.node === null;
  const target = atEnd ? "end" : atStart ? "start" : String(train?.node ?? "start");

  useEffect(() => {
    const list = scroller.current;
    const row = list?.querySelector<HTMLElement>(`[data-row="${target}"]`);
    if (!list || !row) return;
    const top = row.offsetTop - list.offsetTop;
    if (top < list.scrollTop || top + row.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTo({ top: top - list.clientHeight / 3, behavior: "smooth" });
    }
  }, [target]);

  if (!analysis.ok) return null;

  const toneOf = (key: string) => (key === target ? (train?.tone ?? "idle") : undefined);

  return (
    <ol ref={scroller} className={styles.line} aria-label={t.line.label}>
      <li className={styles.row} data-row="start" data-tone={toneOf("start")} data-terminal>
        <span className={styles.rail} aria-hidden="true">
          <span className={styles.dot} />
        </span>
        <span className={styles.body}>
          <span className={styles.terminal}>{t.line.start}</span>
        </span>
        {target === "start" && (
          <TrainFront size={18} className={styles.train} aria-label={t.line.here} />
        )}
      </li>
      {rows.map((row) => {
        const tone = toneOf(String(row.id));
        const visited = train?.visited.has(row.id) ?? false;
        return (
          <li
            key={row.id}
            className={styles.row}
            data-row={row.id}
            data-tone={tone}
            data-container={row.station ? undefined : true}
            data-focus={focus === row.id ? true : undefined}
            style={
              { "--depth": row.depth, "--lane": `var(--lane-${row.lane % LANES})` } as CSSProperties
            }
            onPointerEnter={() => {
              setFocus(row.id);
            }}
            onPointerLeave={() => {
              setFocus(null);
            }}
          >
            <span className={styles.rail} aria-hidden="true">
              <span className={styles.dot} />
            </span>
            <span className={styles.body}>
              {row.station && (
                <span className={styles.chip} data-kind={row.station.kind}>
                  {row.station.label}
                </span>
              )}
              <span className={styles.text}>{row.text}</span>
            </span>
            {tone !== undefined && (
              <TrainFront size={18} className={styles.train} aria-label={t.line.here} />
            )}
            {tone === undefined && visited && (
              <Check size={15} className={styles.visited} aria-label={t.line.passed} />
            )}
          </li>
        );
      })}
      <li className={styles.row} data-row="end" data-tone={toneOf("end")} data-terminal>
        <span className={styles.rail} aria-hidden="true">
          <span className={styles.dot} />
        </span>
        <span className={styles.body}>
          <span className={styles.terminal}>
            <Flag size={14} aria-hidden="true" /> {t.line.end}
          </span>
        </span>
        {atEnd && <TrainFront size={18} className={styles.train} aria-label={t.line.here} />}
      </li>
    </ol>
  );
}
