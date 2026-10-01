import { useEffect, useState } from "react";
import { appHref, type Side } from "../../data/site";
import { MAX_HP, useFight } from "../../fight/FightContext";
import { Person, type Pose } from "./Person";
import { Robot } from "./Robot";
import s from "./Hero.module.css";

const names: Record<Side, string> = { human: "Pessoa", machine: "Máquina" };

export function Hero() {
  const { hp, attack, winner, strike, rematch } = useFight();

  // Hovering or focusing the centre pulls the two figures closer together.
  const [connected, setConnected] = useState(false);
  const connect = {
    onMouseEnter: () => setConnected(true),
    onMouseLeave: () => setConnected(false),
    onFocus: () => setConnected(true),
    onBlur: () => setConnected(false),
  };

  const poseOf = (side: Side): Pose | null => {
    if (winner && winner !== side) return "ko";
    if (attack?.attacker === side) return "attack";
    if (attack?.target === side && attack.phase === "impact") return "hit";
    return null;
  };

  // Kept until the next hit so screen readers have time to read it.
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    if (attack?.phase !== "impact") return;
    setAnnouncement(
      `${names[attack.attacker]} ataca${attack.crit ? " com um golpe crítico" : ""}! ` +
        `${names[attack.target]} perde ${attack.damage} HP e fica com ${hp[attack.target]} de ${MAX_HP}.` +
        (winner ? ` K.O.! ${names[winner]} vence.` : ""),
    );
  }, [attack, hp, winner]);

  return (
    <section className={s.hero} id="inicio">
      <div
        className={s.stage}
        data-connected={(connected && !attack && !winner) || undefined}
        data-ko={winner || undefined}
      >
        <div className={s.scene}>
          <Person className={s.person} reaching={connected && !attack} pose={poseOf("human")} />
          <Robot className={s.robot} reaching={connected && !attack} pose={poseOf("machine")} />
          <div className={s.signal} aria-hidden="true" />
          <div className={s.spark} aria-hidden="true" />

          {/* Projectiles fly along the signal line between the fingertips */}
          {attack && (
            <div className={s.lane} aria-hidden="true">
              <span key={attack.id} className={attack.attacker === "human" ? s.punch : s.laser} />
            </div>
          )}

          {attack?.phase === "impact" && (
            <span
              key={attack.id}
              className={`${s.damage} ${attack.target === "human" ? s.damageHuman : s.damageMachine}`}
              aria-hidden="true"
            >
              −{attack.damage}
              {attack.crit && <small>Crítico!</small>}
            </span>
          )}

          {(["human", "machine"] as const).map((side) => (
            <button
              key={side}
              type="button"
              className={`${s.fighter} ${side === "human" ? s.fighterHuman : s.fighterMachine}`}
              onClick={() => strike(side)}
              disabled={!!winner}
              aria-label={`${names[side]}: atacar a ${names[side === "human" ? "machine" : "human"]}`}
            >
              <span className={s.fighterHint} aria-hidden="true">
                {side === "human" ? "Atacar →" : "← Atacar"}
              </span>
            </button>
          ))}

          {winner && (
            <div className={s.ko}>
              <p className={s.koTitle}>K.O.</p>
              <p className={s.koText}>
                {winner === "human" ? "O Grupo 03 venceu o AI!" : "O AI venceu o Grupo 03!"}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  rematch();
                  setAnnouncement("Revanche! Ambos voltam a 100 HP.");
                }}
              >
                Desforra
              </button>
            </div>
          )}
        </div>

        <h1 className={s.title} {...connect}>
          <span className={s.line}>Interação</span>
          <span className={s.line}>
            <span className={s.pessoa}>Pessoa</span> <span className={s.maquina}>Máquina</span>
          </span>
        </h1>

        <p className={s.caption}>Grupo 03 · 2026/27 · Clica num lado para atacar</p>

        <div className={s.actions} {...connect}>
          <a className="btn btn-primary" href="#reports">
            Ver reports
          </a>
          <a className="btn btn-ghost" href={appHref}>
            Testar app
          </a>
        </div>

        <p className={s.srOnly} aria-live="polite">
          {announcement}
        </p>
      </div>
    </section>
  );
}
