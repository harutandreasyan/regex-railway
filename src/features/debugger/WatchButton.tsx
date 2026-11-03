import { Pause, Play, RotateCcw } from "lucide-react";
import { useAnalysisValue } from "../../app/AnalysisContext";
import { useRailway } from "../../app/store";
import { Button } from "../../ui/Button";
import { totalSteps } from "./train";
import { useT } from "../../i18n";
import styles from "./WatchButton.module.css";

export function WatchButton() {
  const { analysis } = useAnalysisValue();
  const step = useRailway((state) => state.step);
  const playing = useRailway((state) => state.playing);
  const setStep = useRailway((state) => state.setStep);
  const setPlaying = useRailway((state) => state.setPlaying);
  const t = useT();

  const total = analysis.ok ? totalSteps(analysis) : 0;
  const finished = step >= total && total > 0;

  const label = playing
    ? t.watch.pause
    : finished
      ? t.watch.again
      : step > 0
        ? t.watch.resume
        : t.watch.play;
  const icon = playing ? Pause : finished ? RotateCcw : Play;
  const Icon = icon;

  return (
    <Button
      variant="primary"
      className={styles.watch}
      data-playing={playing || undefined}
      icon={<Icon size={18} aria-hidden="true" />}
      disabled={!analysis.ok || total === 0}
      onClick={() => {
        if (finished) setStep(0);
        setPlaying(!playing || finished);
      }}
    >
      {label}
    </Button>
  );
}
