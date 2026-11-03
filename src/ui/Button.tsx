import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

type Variant = "primary" | "soft" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  icon?: ReactNode;
  tip?: string;
  compact?: boolean;
};

export function Button({
  variant = "soft",
  icon,
  tip,
  compact = false,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const iconOnly = children === undefined;
  const classes = [
    styles.button,
    styles[variant],
    iconOnly && styles.icon,
    compact && styles.compact,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button type={type} className={classes} data-tip={tip} {...rest}>
      {icon}
      {children !== undefined && <span className={styles.label}>{children}</span>}
    </button>
  );
}
