import { useRef } from "react";
import { useLookAt } from "../../hooks/useLookAt";
import s from "./Figures.module.css";

type Props = { className?: string; reaching?: boolean };

export function Person({ className, reaching }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useLookAt(ref);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={[s.figure, s.person, reaching && s.reaching, className].filter(Boolean).join(" ")}
    >
      <div className={s.pBackArm} />
      <div className={`${s.pLeg} ${s.pLegL}`} />
      <div className={`${s.pLeg} ${s.pLegR}`} />
      <div className={`${s.pShoe} ${s.pShoeL}`} />
      <div className={`${s.pShoe} ${s.pShoeR}`} />
      <div className={s.pNeck} />
      <div className={s.pTorso} />
      <div className={s.pArm}>
        <div className={s.pSleeve} />
        <div className={s.pForearm} />
        <div className={s.pHand} />
        <div className={s.pFinger} />
      </div>
      <div className={s.pHead}>
        <div className={s.pHair} />
        <span className={`${s.pEye} ${s.pEyeL}`} />
        <span className={`${s.pEye} ${s.pEyeR}`} />
        <span className={s.pSmile} />
      </div>
    </div>
  );
}
