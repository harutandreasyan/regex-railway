import { BadgeCheck, Siren } from "lucide-react";
import { useAnalysisValue } from "../../app/AnalysisContext";
import { useLang, useT } from "../../i18n";
import styles from "./Status.module.css";

export function Status() {
  const { analysis } = useAnalysisValue();
  const lang = useLang((state) => state.lang);
  const t = useT();
  if (!analysis.ok) return null;
  const { run, verified } = analysis;
  const format = new Intl.NumberFormat(lang === "ru" ? "ru-RU" : "en-US");

  if (run.status !== "complete") {
    return (
      <div className={styles.alarm} role="alert">
        <Siren size={20} aria-hidden="true" />
        <div>
          <strong>{t.status.alarmTitle}</strong>
          {t.status.alarmBefore(format.format(run.steps - 1))}
          <code>(a+)+</code>
          {t.status.alarmMiddle}
          <code>+</code>
          {t.status.alarmAfter}
        </div>
      </div>
    );
  }

  return (
    <p className={styles.status}>
      <span>
        <strong>{run.matches.length}</strong> {t.status.matches(run.matches.length)}
      </span>
      <span aria-hidden="true">·</span>
      <span>
        <strong>{format.format(run.steps)}</strong> {t.status.steps(run.steps)}
      </span>
      {verified && (
        <>
          <span aria-hidden="true">·</span>
          <span className={styles.verified}>
            <BadgeCheck size={15} aria-hidden="true" />
            {t.status.verified}
          </span>
        </>
      )}
    </p>
  );
}
