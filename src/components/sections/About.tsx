import { members, stages } from "../../data/site";
import { Section } from "./Section";
import s from "./Sections.module.css";

export function About() {
  return (
    <Section id="quem-somos" index="01" title="Quem Somos">
      <div className={s.about}>
        <div className={s.prose}>
          {/* TODO: substituir pelo texto do grupo */}
          <p>
            Somos o Grupo 03 da unidade curricular de Interação Pessoa-Máquina. Este site reúne o trabalho que
            fazemos ao longo do semestre: os assignments individuais, os relatórios de cada etapa do projeto e
            o protótipo que estamos a desenvolver.
          </p>
          <p>
            O nosso foco é o ponto de contacto entre as pessoas e a tecnologia: perceber quem usa, desenhar para
            essas pessoas e testar com elas.
          </p>
        </div>
        <dl className={s.stats}>
          <div>
            <dt>Membros</dt>
            <dd>{members.length}</dd>
          </div>
          <div>
            <dt>Etapas</dt>
            <dd>{stages.length}</dd>
          </div>
          <div>
            <dt>Protótipo</dt>
            <dd>1</dd>
          </div>
        </dl>
      </div>
    </Section>
  );
}
