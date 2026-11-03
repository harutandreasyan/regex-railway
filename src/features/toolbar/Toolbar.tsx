import { Link2, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../../app/theme";
import { useRailway } from "../../app/store";
import { encodeShare } from "../../engine/share";
import { Button } from "../../ui/Button";
import { useLang, useT } from "../../i18n";
import { Logo } from "./Logo";
import styles from "./Toolbar.module.css";

export function Toolbar({ embedded }: { embedded: boolean }) {
  const { theme, toggle } = useTheme();
  const [copied, setCopied] = useState(false);
  const lang = useLang((state) => state.lang);
  const setLang = useLang((state) => state.setLang);
  const t = useT();

  const share = async () => {
    const { pattern, flags, text } = useRailway.getState();
    const url = new URL(window.location.href);
    url.search = lang === "ru" ? "?lang=ru" : "";
    url.hash = encodeShare({ pattern, flags, text });
    if (!embedded) window.history.replaceState(null, "", url);
    try {
      await navigator.clipboard.writeText(url.toString());
    } finally {
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    }
  };

  return (
    <header className={styles.toolbar}>
      <a
        className={styles.brand}
        href="/"
        target={embedded ? "_blank" : undefined}
        rel="noreferrer"
      >
        <Logo />
        <span>Regex Railway</span>
      </a>
      <div className={styles.actions}>
        <Button
          variant="ghost"
          icon={<Link2 size={17} aria-hidden="true" />}
          onClick={() => void share()}
        >
          {copied ? t.toolbar.copied : t.toolbar.share}
        </Button>
        <Button
          variant="ghost"
          icon={
            theme === "dark" ? (
              <Sun size={17} aria-hidden="true" />
            ) : (
              <Moon size={17} aria-hidden="true" />
            )
          }
          aria-label={theme === "dark" ? t.toolbar.light : t.toolbar.dark}
          onClick={toggle}
        />
        <Button
          variant="ghost"
          className={styles.lang}
          aria-label={t.language.switchLabel}
          lang={lang === "en" ? "ru" : "en"}
          onClick={() => {
            setLang(lang === "en" ? "ru" : "en");
          }}
        >
          {t.language.switchTo}
        </Button>
      </div>
    </header>
  );
}
