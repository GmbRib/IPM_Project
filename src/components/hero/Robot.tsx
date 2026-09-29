import { useRef } from "react";
import { useLookAt } from "../../hooks/useLookAt";
import s from "./Figures.module.css";

type Props = { className?: string; reaching?: boolean };

export function Robot({ className, reaching }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useLookAt(ref);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={[s.figure, s.robot, reaching && s.reaching, className].filter(Boolean).join(" ")}
    >
      <div className={s.rBackArm} />
      <div className={`${s.rLeg} ${s.rLegL}`} />
      <div className={`${s.rLeg} ${s.rLegR}`} />
      <div className={`${s.rFoot} ${s.rFootL}`} />
      <div className={`${s.rFoot} ${s.rFootR}`} />
      <div className={s.rArm}>
        <div className={s.rUpper} />
        <div className={s.rForearm} />
        <div className={s.rElbow} />
        <div className={s.rHand} />
        <div className={s.rFinger} />
      </div>
      <div className={s.rNeck} />
      <div className={s.rTorso}>
        <div className={s.rPanel}>
          <span className={s.rLight} />
          <span className={s.rLight} />
          <span className={s.rLight} />
        </div>
        <div className={s.rCore} />
      </div>
      <div className={s.rShoulder} />
      <div className={s.rAntenna} />
      <div className={`${s.rEar} ${s.rEarL}`} />
      <div className={`${s.rEar} ${s.rEarR}`} />
      <div className={s.rHead}>
        <div className={s.rVisor}>
          <span className={s.rEye} />
          <span className={s.rEye} />
        </div>
        <div className={s.rGrill} />
      </div>
    </div>
  );
}
