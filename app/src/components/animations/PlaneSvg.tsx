import Svg, { Circle, Path } from 'react-native-svg';

import colors from '@/theme/colors';

/** Side view of a plane facing right, in the logo's ink-on-sun style. */
export function PlaneSvg({ width = 80 }: { width?: number }) {
  return (
    <Svg width={width} height={width / 2} viewBox="0 0 64 32">
      {/* tail fin */}
      <Path d="M7 14 L2 4 Q2 3 3.5 3 L8 3 L17 14 Z" fill={colors.ink} />
      {/* far wing */}
      <Path d="M30 14 L25 7 L29.5 7 L39 14 Z" fill={colors.muted} />
      {/* fuselage */}
      <Path
        d="M5 13.5 L49 13.5 Q60 13.5 62.5 16.5 Q60 19.5 49 19.5 L7 19.5 Q3 19.5 3.5 16.5 Q4 13.5 5 13.5 Z"
        fill={colors.ink}
      />
      {/* near wing */}
      <Path d="M27 17 L20 28 Q19.5 29 21 29 L26 29 L41 17 Z" fill={colors.ink} />
      {/* windows */}
      {[22, 27, 32, 37, 42, 47].map((x) => (
        <Circle key={x} cx={x} cy={16} r={1.1} fill={colors.sun} />
      ))}
      {/* cockpit */}
      <Path d="M53 14.6 Q58 14.8 60.2 16 L54.5 16 Z" fill={colors.sun} />
    </Svg>
  );
}
