import { useId, useRef, type UIEvent } from "react";
import { useAnalysisValue } from "../../app/AnalysisContext";
import { useRailway } from "../../app/store";
import { MAX_TEXT } from "../../engine/share";
import { trainAt } from "../debugger/train";
import { segment, type Cursor } from "./segments";
import { useT } from "../../i18n";
import styles from "./TestText.module.css";

export function TestText() {
  const t = useT();
  const id = useId();
  const backdrop = useRef<HTMLDivElement>(null);
  const text = useRailway((state) => state.text);
  const setText = useRailway((state) => state.setText);
  const step = useRailway((state) => state.step);
  const { analysis, text: analyzed } = useAnalysisValue();

  const fresh = analysis.ok && analyzed === text;
  const train = fresh && step > 0 ? trainAt(analysis, step) : null;
  const cursor: Cursor =
    train && train.tone !== "idle"
      ? {
          pos: train.pos,
          end: train.end,
          tone:
            train.tone === "ok" || train.tone === "match"
              ? "ok"
              : train.tone === "fail"
                ? "fail"
                : "probe",
        }
      : train
        ? { pos: train.pos, end: train.pos, tone: "probe" }
        : null;
  const matches = fresh && step === 0 ? analysis.run.matches : [];
  const segments = segment(text.length, matches, cursor);

  const onScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    if (backdrop.current) backdrop.current.scrollTop = event.currentTarget.scrollTop;
  };

  return (
    <div className={styles.wrap}>
      <label htmlFor={id} className="visually-hidden">
        {t.text.label}
      </label>
      <div className={styles.field}>
        <div ref={backdrop} className={styles.backdrop} aria-hidden="true">
          {segments.map((part) => (
            <span
              key={part.start}
              className={styles.segment}
              data-match={part.match === null ? undefined : part.match % 2 === 0 ? "a" : "b"}
              data-cursor={part.cursor ?? undefined}
            >
              {text.slice(part.start, part.end)}
            </span>
          ))}
          {cursor && cursor.pos >= text.length && (
            <span className={styles.caret} data-cursor={cursor.tone} />
          )}
          {"\n"}
        </div>
        <textarea
          id={id}
          name="text"
          className={styles.input}
          value={text}
          maxLength={MAX_TEXT}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          onChange={(event) => {
            setText(event.target.value);
          }}
          onScroll={onScroll}
        />
        <span className={styles.count} aria-hidden="true">
          {text.length}/{MAX_TEXT}
        </span>
      </div>
    </div>
  );
}
