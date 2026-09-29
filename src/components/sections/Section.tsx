import type { ReactNode } from "react";
import s from "./Sections.module.css";

type Props = {
  id: string;
  index: string;
  title: string;
  intro?: string;
  tone?: "light" | "dark";
  children: ReactNode;
};

export function Section({ id, index, title, intro, tone = "light", children }: Props) {
  return (
    <section id={id} className={`${s.section} ${tone === "dark" ? s.dark : ""}`}>
      <div className={s.inner}>
        <header className={s.head}>
          <span className={s.index}>{index}</span>
          <h2 className={s.title}>{title}</h2>
          {intro && <p className={s.intro}>{intro}</p>}
        </header>
        {children}
      </div>
    </section>
  );
}
