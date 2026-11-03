import { useEffect, type CSSProperties } from "react";
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { useAnalysisValue } from "../../app/AnalysisContext";
import { speeds, useRailway, type Speed } from "../../app/store";
import { Button } from "../../ui/Button";
import { narrate } from "./narrate";
import { totalSteps, trainAt } from "./train";
import { useT } from "../../i18n";
import styles from "./Debugger.module.css";

const speedOrder: Speed[] = [1, 2];

export function Debugger() {
  const { analysis, text, flags, phrases } = useAnalysisValue();
  const t = useT();
  const step = useRailway((state) => state.step);
  const playing = useRailway((state) => state.playing);
  const speed = useRailway((state) => state.speed);
  const setStep = useRailway((state) => state.setStep);
  const setPlaying = useRailway((state) => state.setPlaying);
  const setSpeed = useRailway((state) => state.setSpeed);

  const total = analysis.ok ? totalSteps(analysis) : 0;
  const truncated = analysis.ok && analysis.run.traceTruncated;
  const current = Math.min(step, total);
  const finished = current >= total;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      const state = useRailway.getState();
      if (state.step >= total) state.setPlaying(false);
      else state.setStep(state.step + 1);
    }, speeds[speed].interval);
    return () => {
      window.clearInterval(timer);
    };
  }, [playing, speed, total]);

  if (!analysis.ok) return null;

  const event = trainAt(analysis, current).event;
  const narration = narrate(analysis, event, { text, flags, t, phrases });

  const toggle = () => {
    if (finished) setStep(0);
    setPlaying(!playing || finished);
  };

  return (
    <section className={styles.debugger} aria-label={t.debugger.region}>
      <div className={styles.controls}>
        <Button
          variant="ghost"
          icon={<RotateCcw size={16} aria-hidden="true" />}
          aria-label={t.debugger.restart}
          onClick={() => {
            setPlaying(false);
            setStep(0);
          }}
          disabled={current === 0}
        />
        <Button
          variant="ghost"
          icon={<SkipBack size={16} aria-hidden="true" />}
          aria-label={t.debugger.previous}
          onClick={() => {
            setPlaying(false);
            setStep(current - 1);
          }}
          disabled={current === 0}
        />
        <Button
          variant="primary"
          className={styles.play}
          icon={
            playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />
          }
          aria-label={playing ? t.debugger.pause : finished ? t.debugger.replay : t.debugger.play}
          onClick={toggle}
          disabled={total === 0}
        />
        <Button
          variant="ghost"
          icon={<SkipForward size={16} aria-hidden="true" />}
          aria-label={t.debugger.next}
          onClick={() => {
            setPlaying(false);
            setStep(current + 1);
          }}
          disabled={finished}
        />
      </div>

      <div className={styles.timeline}>
        <input
          type="range"
          name="step"
          className={styles.range}
          min={0}
          max={Math.max(total, 1)}
          value={current}
          aria-label={t.debugger.step}
          aria-valuetext={t.debugger.stepOf(current, total)}
          style={{ "--progress": total ? current / total : 0 } as CSSProperties}
          onChange={(event) => {
            setPlaying(false);
            setStep(event.target.valueAsNumber);
          }}
        />
        <p className={styles.narration} data-tone={narration.tone} aria-live="polite">
          <span
            className={styles.counter}
            title={truncated ? t.debugger.truncated(total) : undefined}
          >
            {current}/{total}
            {truncated ? "+" : ""}
          </span>
          {narration.text}
        </p>
      </div>

      <div className={styles.speed} role="radiogroup" aria-label={t.debugger.speed}>
        {speedOrder.map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={speed === value}
            className={styles.speedOption}
            onClick={() => {
              setSpeed(value);
            }}
          >
            {value === 1 ? t.debugger.slow : t.debugger.normal}
          </button>
        ))}
      </div>
    </section>
  );
}
