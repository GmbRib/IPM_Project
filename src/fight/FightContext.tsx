import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Side } from "../data/site";

export const MAX_HP = 100;

/** Timeline of one attack, in ms from the click. */
export const IMPACT_AT = 380;
const ATTACK_ENDS_AT = 900;

export type Attack = {
  id: number;
  attacker: Side;
  target: Side;
  damage: number;
  crit: boolean;
  /** "windup" while the projectile flies, "impact" once it lands. */
  phase: "windup" | "impact";
};

type Fight = {
  hp: Record<Side, number>;
  attack: Attack | null;
  winner: Side | null;
  strike: (attacker: Side) => void;
  rematch: () => void;
};

const FightContext = createContext<Fight | null>(null);

export const opponent = (side: Side): Side => (side === "human" ? "machine" : "human");

function rollDamage() {
  const crit = Math.random() < 0.15;
  const base = 8 + Math.floor(Math.random() * 9); // 8–16
  return { damage: crit ? base * 2 : base, crit };
}

export function FightProvider({ children }: { children: ReactNode }) {
  const [hp, setHp] = useState<Record<Side, number>>({ human: MAX_HP, machine: MAX_HP });
  const [attack, setAttack] = useState<Attack | null>(null);
  const [winner, setWinner] = useState<Side | null>(null);
  const timers = useRef<number[]>([]);
  const busy = useRef(false);
  const nextId = useRef(1);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const strike = useCallback(
    (attacker: Side) => {
      // One attack at a time, and nobody fights after a K.O.
      if (busy.current || winner) return;
      busy.current = true;

      const target = opponent(attacker);
      const event: Attack = { id: nextId.current++, attacker, target, ...rollDamage(), phase: "windup" };
      setAttack(event);

      timers.current.push(
        window.setTimeout(() => {
          setAttack({ ...event, phase: "impact" });
          setHp((prev) => {
            const left = Math.max(0, prev[target] - event.damage);
            if (left === 0) setWinner(attacker);
            return { ...prev, [target]: left };
          });
        }, IMPACT_AT),
        window.setTimeout(() => {
          setAttack(null);
          busy.current = false;
        }, ATTACK_ENDS_AT),
      );
    },
    [winner],
  );

  const rematch = useCallback(() => {
    setHp({ human: MAX_HP, machine: MAX_HP });
    setWinner(null);
  }, []);

  return (
    <FightContext.Provider value={{ hp, attack, winner, strike, rematch }}>{children}</FightContext.Provider>
  );
}

export function useFight() {
  const fight = useContext(FightContext);
  if (!fight) throw new Error("useFight must be used inside <FightProvider>");
  return fight;
}
