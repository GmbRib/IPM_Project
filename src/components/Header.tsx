import { appHref, navLinks } from "../data/site";
import s from "./Header.module.css";

export function Header() {
  return (
    <header className={s.header}>
      <div className={s.inner}>
        <a className={s.brand} href="#inicio" aria-label="Início">
          <span className={s.mark} aria-hidden="true" />
          <span>
            IPM <span className={s.group}>G03</span>
          </span>
        </a>

        <nav className={s.nav} aria-label="Principal">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <a className={`btn btn-primary ${s.cta}`} href={appHref}>
          Testar app
        </a>
      </div>
    </header>
  );
}
