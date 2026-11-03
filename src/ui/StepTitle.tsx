import type { ReactNode } from "react";
import styles from "./StepTitle.module.css";

type StepTitleProps = {
  id: string;
  step: number;
  title: string;
  hint: ReactNode;
  prefix: string;
  action?: ReactNode;
};

export function StepTitle({ id, step, title, hint, prefix, action }: StepTitleProps) {
  return (
    <div className={styles.head}>
      <span className={styles.number} aria-hidden="true">
        {step}
      </span>
      <div className={styles.text}>
        <h2 id={id} className={styles.title}>
          <span className="visually-hidden">{prefix}</span>
          {title}
        </h2>
        <p className={styles.hint}>{hint}</p>
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
