import { useRef, useState } from "react";
import { stages } from "../../data/site";
import { useFollowCursor } from "../../hooks/useFollowCursor";
import { Section } from "./Section";
import s from "./Reports.module.css";

export function Reports() {
  const [active, setActive] = useState<number | null>(null);
  // The floating preview only follows the mouse; keyboard focus just highlights the row.
  const [pointer, setPointer] = useState(false);
  const hover = (n: number | null) => {
    setActive(n);
    setPointer(n !== null);
  };
  const floatRef = useRef<HTMLDivElement>(null);
  useFollowCursor(floatRef);

  return (
    <Section id="reports" index="03" title="Reports" intro="Relatórios de grupo, etapa a etapa.">
      <ol className={s.list} data-active={active !== null || undefined} onMouseLeave={() => hover(null)}>
        {stages.map((stage) => {
          const num = String(stage.number).padStart(2, "0");
          const meta = (
            <>
              <span className={s.num}>{num}</span>
              <span className={s.title}>{stage.title}</span>
              {stage.available && (
                <span className={s.meta}>{[...(stage.topics ?? []), `${stage.pages} pág.`].join(" · ")}</span>
              )}
            </>
          );

          return (
            <li key={stage.number} className={s.item}>
              {stage.available ? (
                <a
                  className={`${s.row} ${active === stage.number ? s.isActive : ""}`}
                  href={stage.href}
                  target="_blank"
                  rel="noopener"
                  onMouseEnter={() => hover(stage.number)}
                  onFocus={() => setActive(stage.number)}
                  onBlur={() => !pointer && setActive(null)}
                >
                  {meta}
                  <span className={s.icon} aria-hidden="true">
                    ↗
                  </span>
                </a>
              ) : (
                <div className={`${s.row} ${s.off}`} onMouseEnter={() => hover(null)}>
                  {meta}
                  <span className={s.badge}>Em breve</span>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* Floating preview that trails the cursor while a report row is hovered */}
      <div ref={floatRef} className={s.float} data-visible={(pointer && active !== null) || undefined} aria-hidden="true">
        <div className={s.card}>
          {stages
            .filter((stage) => stage.previews)
            .map((stage) => (
              <div key={stage.number} className={`${s.pages} ${active === stage.number ? s.pagesOn : ""}`}>
                <img className={s.pageBack} src={stage.previews![1]} alt="" loading="lazy" />
                <img className={s.pageFront} src={stage.previews![0]} alt="" loading="lazy" />
              </div>
            ))}
        </div>
        <span className={s.view}>Abrir</span>
      </div>
    </Section>
  );
}
