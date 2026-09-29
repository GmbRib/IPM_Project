import type { CSSProperties } from "react";
import { members } from "../../data/site";
import { Section } from "./Section";
import s from "./Team.module.css";

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("");

export function Team() {
  return (
    <Section
      id="equipa"
      index="02"
      title="Equipa"
      intro="As pessoas por detrás da máquina. Passa por cima de cada cartão para nos conheceres."
    >
      <div className={s.grid}>
        {members.map((member) => (
          <article key={member.number} className={s.card} tabIndex={0}>
            <div
              className={s.photo}
              style={{ "--zoom": member.photoZoom ?? 1 } as CSSProperties}
            >
              <img
                src={member.photo}
                alt={`Fotografia de ${member.name}`}
                loading="lazy"
                style={{ objectPosition: member.photoPosition }}
              />
              <div className={s.cover} aria-hidden="true">
                <span className={s.doorL} />
                <span className={s.doorR} />
                <span className={s.initials}>{initials(member.name)}</span>
              </div>
            </div>

            <div className={s.body}>
              <h3 className={s.name}>{member.name}</h3>
              <p className={s.number}>Nº {member.number}</p>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
