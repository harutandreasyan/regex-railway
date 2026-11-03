import { useId, useState, type KeyboardEvent } from "react";
import { useAnalysisValue } from "../../app/AnalysisContext";
import { Explain } from "./Explain";
import { Matches } from "./Matches";
import { useT } from "../../i18n";
import styles from "./ResultTabs.module.css";

type Tab = "matches" | "explain";

const order: Tab[] = ["matches", "explain"];

export function ResultTabs() {
  const id = useId();
  const [tab, setTab] = useState<Tab>("matches");
  const { analysis } = useAnalysisValue();
  const t = useT();
  const count = analysis.ok ? analysis.run.matches.length : 0;

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next = order[(order.indexOf(tab) + 1) % order.length] ?? "matches";
    setTab(next);
    document.getElementById(`${id}-${next}`)?.focus();
  };

  const labels: Record<Tab, string> = {
    matches: t.results.matches(count),
    explain: t.results.explain,
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.tabs} role="tablist" aria-label={t.results.label}>
        {order.map((value) => (
          <button
            key={value}
            id={`${id}-${value}`}
            type="button"
            role="tab"
            aria-selected={tab === value}
            aria-controls={`${id}-panel`}
            tabIndex={tab === value ? 0 : -1}
            className={styles.tab}
            onClick={() => {
              setTab(value);
            }}
            onKeyDown={onKeyDown}
          >
            {labels[value]}
          </button>
        ))}
      </div>
      <div
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-${tab}`}
        className={styles.panel}
        tabIndex={0}
      >
        {tab === "matches" ? <Matches /> : <Explain />}
      </div>
    </div>
  );
}
