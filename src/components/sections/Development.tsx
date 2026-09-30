import { appHref } from "../../data/site";
import { Section } from "./Section";
import s from "./Sections.module.css";

export function Development() {
  return (
    <Section id="development" index="05" title="Development" tone="dark">
      <div className={s.devBand}>
        {/* TODO: descrever o protótipo */}
        <p className={s.devText}>
          O protótipo que estamos a construir ao longo do semestre. Experimenta a versão mais recente e diz-nos o
          que achas.
        </p>
        <a className={`btn ${s.devBtn}`} href={appHref}>
          Testar app <span aria-hidden="true">→</span>
        </a>
      </div>
    </Section>
  );
}
