import { useEffect, useMemo, useState } from "react";
import { Map as MapIcon, Rows3 } from "lucide-react";
import { Debugger } from "../features/debugger/Debugger";
import { WatchButton } from "../features/debugger/WatchButton";
import { Diagram } from "../features/diagram/Diagram";
import { Legend } from "../features/legend/Legend";
import { LineView } from "../features/line/LineView";
import { Examples } from "../features/pattern/Examples";
import { PatternInput } from "../features/pattern/PatternInput";
import { ResultTabs } from "../features/results/ResultTabs";
import { Status } from "../features/results/Status";
import { TestText } from "../features/text/TestText";
import { Toolbar } from "../features/toolbar/Toolbar";
import { StepTitle } from "../ui/StepTitle";
import { useLang, useT } from "../i18n";
import { AnalysisContext } from "./AnalysisContext";
import { useRailway } from "./store";
import { isEmbedded } from "./embed";
import { useAnalysis } from "./useAnalysis";
import { useSharedState } from "./useSharedState";
import styles from "./App.module.css";

type View = "line" | "map";

export function App() {
  const [embedded] = useState(isEmbedded);
  const [view, setView] = useState<View>("line");
  const { analysis, pattern, flags, text, phrases } = useAnalysis();
  const value = useMemo(
    () => ({ analysis, pattern, flags, text, phrases }),
    [analysis, pattern, flags, text, phrases],
  );
  const lang = useLang((state) => state.lang);
  const t = useT();
  useSharedState();

  useEffect(() => {
    document.documentElement.lang = lang;
    useRailway.getState().localizeExample();
  }, [lang]);

  return (
    <AnalysisContext value={value}>
      <div className={styles.page} data-embedded={embedded || undefined}>
        <Toolbar embedded={embedded} />
        <main className={styles.main}>
          <section className={styles.intro} aria-labelledby="title">
            <h1 id="title" className={styles.title}>
              {t.intro.before}
              <span className={styles.highlight}>{t.intro.highlight}</span>
              {t.intro.after}
            </h1>
            <p className={styles.lead}>{t.intro.lead}</p>
          </section>

          <section className={styles.card} aria-labelledby="step-pattern">
            <StepTitle
              id="step-pattern"
              step={1}
              title={t.steps.pattern.title}
              hint={t.steps.pattern.hint}
              prefix={t.step(1)}
            />
            <PatternInput />
            <Examples />
          </section>

          <section className={styles.card} aria-labelledby="step-text">
            <StepTitle
              id="step-text"
              step={2}
              title={t.steps.text.title}
              hint={t.steps.text.hint}
              prefix={t.step(2)}
            />
            <TestText />
          </section>

          <section className={`${styles.card} ${styles.map}`} aria-labelledby="step-watch">
            <StepTitle
              id="step-watch"
              step={3}
              title={t.steps.watch.title}
              hint={t.steps.watch.hint}
              prefix={t.step(3)}
              action={<WatchButton />}
            />
            <Status />
            <div className={styles.views} role="radiogroup" aria-label={t.views.label}>
              <button
                type="button"
                role="radio"
                aria-checked={view === "line"}
                className={styles.viewOption}
                onClick={() => {
                  setView("line");
                }}
              >
                <Rows3 size={15} aria-hidden="true" />
                {t.views.line}
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={view === "map"}
                className={styles.viewOption}
                onClick={() => {
                  setView("map");
                }}
              >
                <MapIcon size={15} aria-hidden="true" />
                {t.views.map}
              </button>
            </div>
            <div className={styles.stage} data-view={view}>
              <div className={styles.mapView}>
                <Diagram />
              </div>
              <div className={styles.lineView}>
                <LineView />
              </div>
            </div>
            <Debugger />
            <Legend />
          </section>

          <section className={styles.card} aria-labelledby="step-results">
            <StepTitle
              id="step-results"
              step={4}
              title={t.steps.results.title}
              hint={t.steps.results.hint}
              prefix={t.step(4)}
            />
            <ResultTabs />
          </section>
        </main>
        {!embedded && (
          <footer className={styles.footer}>
            {t.footer.before}
            <a href="https://harut-andreasyan.vercel.app" target="_blank" rel="noreferrer">
              {t.footer.author}
            </a>
            {t.footer.after}
          </footer>
        )}
      </div>
    </AnalysisContext>
  );
}
