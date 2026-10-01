import type { CSSProperties } from "react";
import { assignmentFile, assignments, members } from "../../data/site";
import { Section } from "./Section";
import s from "./Assignments.module.css";

/**
 * One file folder per member. Their assignments are the papers inside:
 * hovering (or focusing) a folder tips the front open and fans the papers out.
 */
export function Assignments() {
  return (
    <Section id="assignments" index="03" title="Assignments" intro="Trabalhos individuais: cada membro tem a sua pasta.">
      <ul className={s.summary}>
        {assignments.map((a) => (
          <li key={a.number}>
            {a.title} · <strong>{a.submitted.length}</strong>/{members.length} entregues
          </li>
        ))}
      </ul>

      <div className={s.grid}>
        {members.map((member, i) => {
          const firstName = member.name.split(" ")[0];
          const delivered = assignments.filter((a) => a.submitted.includes(member.number));

          return (
            <article
              key={member.number}
              className={s.folder}
              data-side={i % 2 === 0 ? "human" : "machine"}
              // With nothing to open there's no link inside, so let the folder itself take focus.
              tabIndex={delivered.length ? undefined : 0}
              aria-label={delivered.length ? undefined : `${member.name}: nenhum assignment entregue ainda`}
            >
              <div className={s.back} aria-hidden="true">
                <span className={s.tab}>{firstName}</span>
              </div>

              <div className={s.papers}>
                {assignments.map((a, p) => {
                  const done = a.submitted.includes(member.number);
                  const file = assignmentFile(a.number, member.number);
                  const style = { "--i": p } as CSSProperties;

                  return done ? (
                    <a
                      key={a.number}
                      className={s.paper}
                      style={style}
                      href={file.href}
                      target="_blank"
                      rel="noopener"
                      aria-label={`${a.title} de ${member.name} (PDF)`}
                    >
                      <img src={file.preview} alt="" loading="lazy" />
                      <span className={s.paperLabel}>{a.title}</span>
                    </a>
                  ) : (
                    <div key={a.number} className={`${s.paper} ${s.blank}`} style={style} aria-hidden="true">
                      <span className={s.stamp}>Em breve</span>
                      <span className={s.paperLabel}>{a.title}</span>
                    </div>
                  );
                })}
              </div>

              <div className={s.front}>
                <img
                  className={s.avatar}
                  src={member.photo}
                  alt=""
                  loading="lazy"
                  style={{ objectPosition: member.photoPosition }}
                />
                <div className={s.who}>
                  <h3 className={s.name}>{member.name}</h3>
                  <p className={s.number}>Nº {member.number}</p>
                </div>
                <span className={s.status}>
                  {delivered.length}/{assignments.length} entregue{assignments.length === 1 ? "" : "s"}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
