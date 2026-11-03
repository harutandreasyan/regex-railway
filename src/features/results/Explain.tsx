import { useAnalysisValue } from "../../app/AnalysisContext";
import { useRailway } from "../../app/store";
import type { Explanation } from "../../engine/explain";
import { useT } from "../../i18n";
import styles from "./Explain.module.css";

function Item({ item }: { item: Explanation }) {
  const focus = useRailway((state) => state.focus);
  const setFocus = useRailway((state) => state.setFocus);
  return (
    <li>
      <button
        type="button"
        className={styles.line}
        data-focus={focus === item.id ? true : undefined}
        onPointerEnter={() => {
          setFocus(item.id);
        }}
        onPointerLeave={() => {
          setFocus(null);
        }}
        onFocus={() => {
          setFocus(item.id);
        }}
        onBlur={() => {
          setFocus(null);
        }}
      >
        {item.text}
      </button>
      {item.children.length > 0 && (
        <ul className={styles.children}>
          {item.children.map((child) => (
            <Item key={child.id} item={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function Explain() {
  const { analysis } = useAnalysisValue();
  const t = useT();
  if (!analysis.ok) return <p className={styles.empty}>{t.results.fixToExplain}</p>;
  return (
    <ul className={styles.tree}>
      <Item item={analysis.explanation} />
    </ul>
  );
}
