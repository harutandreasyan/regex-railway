import { useRailway } from "../../app/store";
import { examples } from "../../engine/examples";
import { useT } from "../../i18n";
import styles from "./Examples.module.css";

export function Examples() {
  const exampleId = useRailway((state) => state.exampleId);
  const loadExample = useRailway((state) => state.loadExample);
  const t = useT();

  return (
    <div className={styles.row}>
      <span className={styles.label} id="examples-label">
        {t.examples.label}
      </span>
      <div className={styles.list} role="radiogroup" aria-labelledby="examples-label">
        {examples.map((example) => (
          <button
            key={example.id}
            type="button"
            role="radio"
            aria-checked={exampleId === example.id}
            className={styles.chip}
            data-trap={example.id === "trap" ? true : undefined}
            onClick={() => {
              loadExample(example.id);
            }}
          >
            {t.examples.names[example.id] ?? example.name}
          </button>
        ))}
      </div>
    </div>
  );
}
