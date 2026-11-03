import { useId, useRef, type UIEvent } from "react";
import { TriangleAlert } from "lucide-react";
import { useAnalysisValue } from "../../app/AnalysisContext";
import { useRailway } from "../../app/store";
import { flagKeys, flagLetters } from "../../engine/flags";
import { tokenize } from "../../engine/tokens";
import { useT } from "../../i18n";
import styles from "./PatternInput.module.css";

export function PatternInput() {
  const id = useId();
  const backdrop = useRef<HTMLDivElement>(null);
  const pattern = useRailway((state) => state.pattern);
  const flags = useRailway((state) => state.flags);
  const setPattern = useRailway((state) => state.setPattern);
  const toggleFlag = useRailway((state) => state.toggleFlag);
  const focus = useRailway((state) => state.focus);
  const { analysis, pattern: analyzed, phrases } = useAnalysisValue();
  const t = useT();

  const fresh = analyzed === pattern;
  const tokens = tokenize(fresh && analysis.ok ? analysis.parsed.root : null, pattern);
  const error = fresh && !analysis.ok ? analysis.error : null;

  const onScroll = (event: UIEvent<HTMLInputElement>) => {
    if (backdrop.current) backdrop.current.scrollLeft = event.currentTarget.scrollLeft;
  };

  return (
    <div className={styles.wrap}>
      <label htmlFor={id} className="visually-hidden">
        {t.pattern.label}
      </label>
      <div className={styles.field} data-invalid={error ? true : undefined}>
        <span className={styles.slash} aria-hidden="true">
          /
        </span>
        <div className={styles.editor}>
          <div ref={backdrop} className={styles.backdrop} aria-hidden="true">
            {tokens.map((token) => {
              const broken = error && token.start <= error.position && error.position < token.end;
              return (
                <span
                  key={`${token.start}-${token.kind}`}
                  className={styles.token}
                  data-kind={token.kind}
                  data-focus={token.node !== null && token.node === focus ? true : undefined}
                  data-error={broken ? true : undefined}
                >
                  {pattern.slice(token.start, token.end)}
                </span>
              );
            })}
            {error && error.position >= pattern.length && (
              <span className={styles.endError}> </span>
            )}
          </div>
          <input
            id={id}
            name="pattern"
            className={styles.input}
            value={pattern}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            onChange={(event) => {
              setPattern(event.target.value);
            }}
            onScroll={onScroll}
          />
        </div>
        <span className={styles.slash} aria-hidden="true">
          /
        </span>
        <div className={styles.flags} role="group" aria-label={t.pattern.flags}>
          {flagKeys.map((key) => (
            <button
              key={key}
              type="button"
              className={styles.flag}
              aria-pressed={flags[key]}
              aria-label={t.pattern.hints[key]}
              title={t.pattern.hints[key]}
              onClick={() => {
                toggleFlag(key);
              }}
            >
              {flagLetters[key]}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <p id={`${id}-error`} className={styles.error} role="alert">
          <TriangleAlert size={15} aria-hidden="true" />
          <span>
            {phrases.error(error.detail)}{" "}
            <span className={styles.where}>{t.pattern.at(error.position + 1)}</span>
          </span>
        </p>
      )}
    </div>
  );
}
