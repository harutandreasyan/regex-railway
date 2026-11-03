import { useAnalysisValue } from "../../app/AnalysisContext";
import { useT } from "../../i18n";
import styles from "./Matches.module.css";

const LIMIT = 50;

const visible = (value: string, empty: string) =>
  value.replace(/\n/g, "↵").replace(/\t/g, "⇥") || empty;

export function Matches() {
  const { analysis, text } = useAnalysisValue();
  const t = useT();
  if (!analysis.ok) return <p className={styles.empty}>{t.results.fixToMatch}</p>;

  const { matches } = analysis.run;
  const names = new Map([...analysis.parsed.groupNames].map(([name, index]) => [index, name]));

  if (!matches.length) {
    return <p className={styles.empty}>{t.results.none}</p>;
  }

  return (
    <ol className={styles.list}>
      {matches.slice(0, LIMIT).map((match, index) => (
        <li
          key={`${match.start}-${match.end}`}
          className={styles.item}
          data-tone={index % 2 === 0 ? "a" : "b"}
        >
          <div className={styles.row}>
            <span className={styles.index}>{index + 1}</span>
            <code className={`${styles.value} selectable`}>
              {visible(match.value, t.results.empty)}
            </code>
            <span className={styles.position}>
              {match.start}–{match.end}
            </span>
          </div>
          {match.captures.length > 0 && (
            <dl className={styles.groups}>
              {match.captures.map((capture, group) => (
                <div key={group} className={styles.group}>
                  <dt>
                    #{group + 1}
                    {names.get(group + 1) ? ` ${names.get(group + 1) ?? ""}` : ""}
                  </dt>
                  <dd>
                    {capture ? (
                      <code className="selectable">
                        {visible(text.slice(capture.start, capture.end), t.results.empty)}
                      </code>
                    ) : (
                      <em>{t.results.notUsed}</em>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </li>
      ))}
      {matches.length > LIMIT && (
        <li className={styles.more}>{t.results.more(matches.length - LIMIT)}</li>
      )}
    </ol>
  );
}
