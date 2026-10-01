import { stages } from "../../data/site";
import { FilePreview, usePreviewHover } from "./FilePreview";
import { Section } from "./Section";
import s from "./Reports.module.css";

const previewFiles = stages
  .filter((stage) => stage.previews)
  .map((stage) => ({ key: String(stage.number), pages: stage.previews! }));

export function Reports() {
  const { active, visible, hover, rowProps } = usePreviewHover();

  return (
    <Section id="reports" index="04" title="Reports" intro="Relatórios de grupo, etapa a etapa.">
      <ol className={s.list} data-active={active !== null || undefined} onMouseLeave={() => hover(null)}>
        {stages.map((stage) => {
          const key = String(stage.number);
          const num = key.padStart(2, "0");
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
                  className={`${s.row} ${active === key ? s.isActive : ""}`}
                  href={stage.href}
                  target="_blank"
                  rel="noopener"
                  {...rowProps(key)}
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

      <FilePreview files={previewFiles} active={active} visible={visible} />
    </Section>
  );
}
