import { useEffect, useState, type CSSProperties } from "react";
import { appHref, navLinks, type Side } from "../data/site";
import { useActiveSection } from "../hooks/useActiveSection";
import { MAX_HP, useFight } from "../fight/FightContext";
import s from "./Header.module.css";

const sides: { side: Side; label: string; player: string }[] = [
  { side: "human", label: "Grupo03", player: "P1" },
  { side: "machine", label: "AI", player: "P2" },
];

export function Header() {
  const active = useActiveSection(navLinks.map((l) => l.id));
  const [menuOpen, setMenuOpen] = useState(false);
  const { hp, attack } = useFight();

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const links = (side: Side) =>
    navLinks
      .filter((l) => l.side === side)
      .map((l) => (
        <a
          key={l.id}
          href={`#${l.id}`}
          className={s.link}
          aria-current={active === l.id ? "location" : undefined}
          onClick={() => setMenuOpen(false)}
        >
          {l.label}
        </a>
      ));

  return (
    <header className={s.header} data-menu={menuOpen || undefined}>
      <div className={s.inner}>
        {sides.map(({ side, label, player }) => (
          <div key={side} className={`${s.side} ${s[side]}`}>
            <div className={s.hud}>
              <span className={s.tag}>
                <span className={s.player}>{player}</span> <span className={s.tagLabel}>{label}</span>
              </span>
              <span
                className={s.bar}
                role="meter"
                aria-label={`HP ${label}`}
                aria-valuemin={0}
                aria-valuemax={MAX_HP}
                aria-valuenow={hp[side]}
                data-low={hp[side] <= MAX_HP * 0.25 || undefined}
                style={{ "--hp": hp[side] / MAX_HP } as CSSProperties}
              >
                <span className={s.trail} />
                <span className={s.fill} />
                {/* Keyed by attack id so the flash replays on every hit */}
                {attack?.phase === "impact" && attack.target === side && (
                  <span key={attack.id} className={s.flash} />
                )}
              </span>
              <span className={s.hpValue} aria-hidden="true">
                {hp[side]}
              </span>
            </div>
            <nav className={s.nav} aria-label={`Secções ${label}`}>
              {links(side)}
            </nav>
          </div>
        ))}

        <div className={s.center}>
          <a className={s.badge} href="#inicio" aria-label="Início — IPM Grupo 03">
            <span className={s.vs} aria-hidden="true">
              VS
            </span>
          </a>
          <a className={s.cta} href={appHref}>
            Testar app
          </a>
        </div>

        <button
          type="button"
          className={s.menuBtn}
          aria-expanded={menuOpen}
          aria-controls="menu-panel"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className={s.menuIcon} aria-hidden="true" />
          <span className={s.srOnly}>{menuOpen ? "Fechar menu" : "Abrir menu"}</span>
        </button>
      </div>

      <div id="menu-panel" className={s.panel} hidden={!menuOpen}>
        {sides.map(({ side, label }) => (
          <nav key={side} className={`${s.panelGroup} ${s[side]}`} aria-label={`Secções ${label}`}>
            <span className={s.panelLabel}>{label}</span>
            {links(side)}
          </nav>
        ))}
        <a className={`btn btn-primary ${s.panelCta}`} href={appHref}>
          Testar app
        </a>
      </div>
    </header>
  );
}
