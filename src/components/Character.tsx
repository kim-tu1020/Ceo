import type { CSSProperties } from "react";

interface Props {
  hair: string;
  shirt: string;
  accent: string;
  skin?: string;
  walking?: boolean;
  seated?: boolean;
  facing?: 1 | -1;
  lead?: boolean;
  scale?: number;
}

/** CSS 블록으로 그리는 도트 캐릭터 */
export function Character({
  hair,
  shirt,
  accent,
  skin = "#ffdcc4",
  walking = false,
  seated = false,
  facing = 1,
  lead = false,
  scale = 1,
}: Props) {
  const style = {
    "--hair": hair,
    "--shirt": shirt,
    "--accent": accent,
    "--skin": skin,
    transform: `scale(${scale * facing}, ${scale})`,
  } as CSSProperties;

  return (
    <div className={`char${walking ? " walking" : ""}${seated ? " seated" : ""}`} style={style}>
      {lead && <span className="char-crown">★</span>}
      <span className="char-hair-back" />
      <span className="char-head">
        <span className="char-eye l" />
        <span className="char-eye r" />
        <span className="char-blush l" />
        <span className="char-blush r" />
      </span>
      <span className="char-hair" />
      <span className="char-body">
        <span className="char-ribbon" />
      </span>
      <span className="char-leg l" />
      <span className="char-leg r" />
    </div>
  );
}
