import { useState } from "react";
import { appHref } from "../../data/site";
import { Person } from "./Person";
import { Robot } from "./Robot";
import s from "./Hero.module.css";

export function Hero() {
  // Hovering or focusing the centre pulls the two figures closer together.
  const [connected, setConnected] = useState(false);
  const connect = {
    onMouseEnter: () => setConnected(true),
    onMouseLeave: () => setConnected(false),
    onFocus: () => setConnected(true),
    onBlur: () => setConnected(false),
  };

  return (
    <section className={s.hero} id="inicio">
      <div className={s.stage} data-connected={connected || undefined}>
        <div className={s.scene}>
          <Person className={s.person} reaching={connected} />
          <Robot className={s.robot} reaching={connected} />
          <div className={s.signal} aria-hidden="true" />
          <div className={s.spark} aria-hidden="true" />
        </div>

        <h1 className={s.title} {...connect}>
          <span className={s.line}>Interação</span>
          <span className={s.line}>
            <span className={s.pessoa}>Pessoa</span> <span className={s.maquina}>Máquina</span>
          </span>
        </h1>

        <p className={s.caption}>Grupo 03 · Mestrado · 2026/27</p>

        <div className={s.actions} {...connect}>
          <a className="btn btn-primary" href="#reports">
            Ver reports
          </a>
          <a className="btn btn-ghost" href={appHref}>
            Testar app
          </a>
        </div>
      </div>
    </section>
  );
}
