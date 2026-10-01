import { useState, type CSSProperties, type KeyboardEvent } from "react";
import { logoVersions } from "../../data/site";
import { Section } from "./Section";
import s from "./LogoEvolution.module.css";

const last = logoVersions.length - 1;

/**
 * The logo's evolution as a flight path: each version is a stop, and a
 * small plane flies to the one being shown.
 */
export function LogoEvolution() {
  const [active, setActive] = useState(0);
  const version = logoVersions[active];
  const clamp = (i: number) => Math.max(0, Math.min(last, i));
  const go = (i: number) => setActive(clamp(i));

  // Arrow keys (and Home/End) move between the stops, like a tab list.
  const onKeyDown = (e: KeyboardEvent<HTMLOListElement>) => {
    const targets: Record<string, number> = {
      ArrowRight: active + 1,
      ArrowDown: active + 1,
      ArrowLeft: active - 1,
      ArrowUp: active - 1,
      Home: 0,
      End: last,
    };
    if (!(e.key in targets)) return;
    e.preventDefault();
    const next = clamp(targets[e.key]);
    go(next);
    e.currentTarget.querySelectorAll("button")[next]?.focus();
  };

  return (
    <Section
      id="logotipo"
      index="05"
      title="Logótipo"
      intro="Do primeiro esboço ao Pack&Sun: como o logótipo evoluiu."
    >
      <div className={s.viewer}>
        <figure className={s.stage} data-final={active === last || undefined} aria-live="polite">
          {logoVersions.map((v, i) => (
            <img
              key={v.src}
              className={`${s.image} ${i === active ? s.shown : ""}`}
              src={v.src}
              alt={i === active ? `Versão ${i + 1} do logótipo: ${v.title}` : ""}
              aria-hidden={i !== active}
              loading="lazy"
              style={{ "--tilt": `${[-2, 1.5, -1, 0][i] ?? 0}deg` } as CSSProperties}
            />
          ))}
          <span className={s.badge}>V{active + 1}</span>
        </figure>

        <div className={s.info}>
          <p className={s.step}>
            Versão {active + 1} de {logoVersions.length}
          </p>
          <h3 className={s.title}>{version.title}</h3>
          <p className={s.description}>{version.description}</p>
          <div className={s.controls}>
            <button type="button" className={s.arrow} onClick={() => go(active - 1)} disabled={active === 0}>
              <span aria-hidden="true">←</span> Anterior
            </button>
            <button type="button" className={s.arrow} onClick={() => go(active + 1)} disabled={active === last}>
              Seguinte <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>

      <div className={s.path} style={{ "--at": active, "--count": logoVersions.length } as CSSProperties}>
        <div className={s.line} aria-hidden="true">
          <span className={s.flown} />
        </div>

        <ol className={s.stops} aria-label="Versões do logótipo" onKeyDown={onKeyDown}>
          {logoVersions.map((v, i) => (
            <li key={v.src}>
              <button
                type="button"
                className={s.stop}
                aria-current={i === active ? "step" : undefined}
                aria-label={`Versão ${i + 1}: ${v.name}`}
                tabIndex={i === active ? 0 : -1}
                onClick={() => go(i)}
              >
                <span className={s.thumb}>
                  <img src={v.src} alt="" loading="lazy" />
                </span>
                <span className={s.stopLabel}>
                  <span className={s.stopNum}>V{i + 1}</span> {v.name}
                </span>
              </button>
            </li>
          ))}
        </ol>

      </div>
    </Section>
  );
}
