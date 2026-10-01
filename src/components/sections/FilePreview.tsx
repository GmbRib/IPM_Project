import { useRef, useState } from "react";
import { useFollowCursor } from "../../hooks/useFollowCursor";
import s from "./FilePreview.module.css";

export type PreviewFile = {
  key: string;
  /** Page images: the first is shown in front, an optional second fans out behind it. */
  pages: string[];
};

/**
 * Tracks which row is active. The floating preview only follows the mouse;
 * keyboard focus just highlights the row.
 */
export function usePreviewHover() {
  const [active, setActive] = useState<string | null>(null);
  const [pointer, setPointer] = useState(false);

  return {
    active,
    visible: pointer && active !== null,
    hover: (key: string | null) => {
      setActive(key);
      setPointer(key !== null);
    },
    rowProps: (key: string) => ({
      onMouseEnter: () => {
        setActive(key);
        setPointer(true);
      },
      onFocus: () => setActive(key),
      onBlur: () => !pointer && setActive(null),
    }),
  };
}

type Props = { files: PreviewFile[]; active: string | null; visible: boolean; label?: string };

/** Floating preview card that trails the cursor while a file row is hovered. */
export function FilePreview({ files, active, visible, label = "Abrir" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useFollowCursor(ref);

  return (
    <div ref={ref} className={s.float} data-visible={visible || undefined} aria-hidden="true">
      <div className={s.card}>
        {files.map((file) => (
          <div key={file.key} className={`${s.pages} ${active === file.key ? s.pagesOn : ""}`}>
            {file.pages[1] && <img className={s.pageBack} src={file.pages[1]} alt="" loading="lazy" />}
            <img className={s.pageFront} src={file.pages[0]} alt="" loading="lazy" />
          </div>
        ))}
      </div>
      <span className={s.view}>{label}</span>
    </div>
  );
}
