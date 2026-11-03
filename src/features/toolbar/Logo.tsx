export function Logo() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--surface-2)" />
      <path
        d="M5 21 H12 C16 21 16 11 20 11 H27"
        fill="none"
        stroke="var(--lane-0)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M5 21 H27"
        fill="none"
        stroke="var(--lane-2)"
        strokeWidth="3.2"
        strokeLinecap="round"
        opacity="0.9"
      />
      <circle
        cx="12"
        cy="21"
        r="3.4"
        fill="var(--station)"
        stroke="var(--lane-2)"
        strokeWidth="2"
      />
      <circle
        cx="21"
        cy="11"
        r="3.4"
        fill="var(--station)"
        stroke="var(--lane-0)"
        strokeWidth="2"
      />
    </svg>
  );
}
