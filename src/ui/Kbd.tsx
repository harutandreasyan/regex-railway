import styles from "./Kbd.module.css";

export function Kbd({ keys }: { keys: readonly string[] }) {
  return (
    <span className={styles.group}>
      {keys.map((key) => (
        <kbd key={key} className={styles.key}>
          {key}
        </kbd>
      ))}
    </span>
  );
}
