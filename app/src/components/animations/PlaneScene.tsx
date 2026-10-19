import { useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';

import colors from '@/theme/colors';

import { PlaneSvg } from './PlaneSvg';

// A little sky with a sun (as in the logo), drifting clouds and a runway.
// "takeoff": the plane speeds down the runway, lifts its nose and climbs away.
// "landing": the plane comes down, flares, touches down with a puff and stops.

const HEIGHT = 220;
const GROUND = 176; // runway top, in px from the scene's top
const PLANE_W = 84;
const PLANE_H = PLANE_W / 2;

export const TAKEOFF_MS = 2600;
export const LANDING_MS = 2800;
/** With "reduce motion" on: show the end state and move on quickly. */
const REDUCED_MS = 500;

type Props = {
  mode: 'takeoff' | 'landing';
  /** Called once when the animation has finished. */
  onDone?: () => void;
  children?: ReactNode;
};

export function PlaneScene({ mode, onDone, children }: Props) {
  const [width, setWidth] = useState(0);
  const reduced = useReducedMotion();
  const p = useSharedValue(reduced ? 1 : 0);
  const drift = useSharedValue(0);

  useEffect(() => {
    if (!width) return;
    const ms = reduced ? REDUCED_MS : mode === 'takeoff' ? TAKEOFF_MS : LANDING_MS;
    if (!reduced) {
      p.set(withTiming(1, { duration: ms, easing: Easing.linear }));
      drift.set(withRepeat(withTiming(1, { duration: 9000, easing: Easing.linear }), -1, false));
    }
    const timer = setTimeout(() => onDone?.(), ms);
    return () => {
      clearTimeout(timer);
      cancelAnimation(p);
      cancelAnimation(drift);
    };
    // Runs once per scene, as soon as we know its width.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  return (
    <View className="items-center gap-4">
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        className="w-full overflow-hidden rounded-card bg-sun-soft"
        style={{ height: HEIGHT }}
        accessible
        accessibilityRole="image"
        accessibilityLabel={mode === 'takeoff' ? 'Um avião a descolar' : 'Um avião a aterrar'}
      >
        {width > 0 && (
          <>
            <Sun x={width * 0.68} />
            <Cloud drift={drift} width={width} top={28} size={64} offset={0.1} />
            <Cloud drift={drift} width={width} top={70} size={44} offset={0.6} />
            <Runway width={width} />
            <Shadow p={p} width={width} mode={mode} />
            {mode === 'landing' && <Puff p={p} width={width} />}
            <FlyingPlane p={p} width={width} mode={mode} />
          </>
        )}
      </View>
      {children}
    </View>
  );
}

/** Where the plane is at progress t (0–1), shared by the plane and its shadow. */
function path(t: number, width: number, mode: 'takeoff' | 'landing') {
  'worklet';
  if (mode === 'takeoff') {
    // Speeding up on the runway, then rotating and climbing out of view.
    const run = Easing.in(Easing.quad)(Math.min(t / 0.6, 1));
    const climb = Easing.in(Easing.quad)(Math.max((t - 0.5) / 0.5, 0));
    return {
      x: interpolate(run, [0, 1], [width * 0.04, width * 0.62]) + climb * width * 0.6,
      lift: climb * (GROUND + PLANE_H),
      rotate: interpolate(t, [0, 0.45, 0.62, 1], [0, 0, -14, -20], Extrapolation.CLAMP),
      scale: interpolate(t, [0, 0.55, 1], [1, 1, 0.75], Extrapolation.CLAMP),
    };
  }
  // Descending from the top-left, flaring, a small bounce, then braking to a stop.
  const approach = Easing.out(Easing.quad)(Math.min(t / 0.6, 1));
  const roll = Easing.out(Easing.cubic)(Math.max((t - 0.6) / 0.4, 0));
  const bounce = interpolate(t, [0.6, 0.66, 0.72], [0, 6, 0], Extrapolation.CLAMP);
  return {
    x: interpolate(approach, [0, 1], [-PLANE_W, width * 0.42]) + roll * width * 0.16,
    lift: interpolate(approach, [0, 1], [GROUND - 20, 0]) + bounce,
    rotate: interpolate(t, [0, 0.45, 0.58, 0.7, 1], [12, 8, -4, 0, 0], Extrapolation.CLAMP),
    scale: interpolate(t, [0, 0.6, 1], [0.75, 1, 1], Extrapolation.CLAMP),
  };
}

function FlyingPlane({
  p,
  width,
  mode,
}: {
  p: SharedValue<number>;
  width: number;
  mode: 'takeoff' | 'landing';
}) {
  const style = useAnimatedStyle(() => {
    const { x, lift, rotate, scale } = path(p.get(), width, mode);
    return {
      transform: [
        { translateX: x },
        { translateY: GROUND - PLANE_H + 2 - lift },
        { rotate: `${rotate}deg` },
        { scale },
      ],
    };
  });
  // Speed lines while moving fast on the ground.
  const lines = useAnimatedStyle(() => {
    const t = p.get();
    const opacity =
      mode === 'takeoff'
        ? interpolate(t, [0.15, 0.3, 0.6, 0.75], [0, 1, 1, 0], Extrapolation.CLAMP)
        : interpolate(t, [0.62, 0.7, 0.85, 0.95], [0, 1, 1, 0], Extrapolation.CLAMP);
    return { opacity };
  });

  return (
    <Animated.View
      style={[{ position: 'absolute', left: 0, top: 0, width: PLANE_W, height: PLANE_H }, style]}
    >
      <Animated.View
        style={[{ position: 'absolute', right: PLANE_W + 2, top: PLANE_H * 0.35 }, lines]}
      >
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              width: 22 - i * 5,
              height: 2.5,
              borderRadius: 2,
              backgroundColor: colors.ember,
              marginBottom: 4,
              marginLeft: i * 6,
            }}
          />
        ))}
      </Animated.View>
      <PlaneSvg width={PLANE_W} />
    </Animated.View>
  );
}

function Shadow({
  p,
  width,
  mode,
}: {
  p: SharedValue<number>;
  width: number;
  mode: 'takeoff' | 'landing';
}) {
  const style = useAnimatedStyle(() => {
    const { x, lift } = path(p.get(), width, mode);
    const k = interpolate(lift, [0, 80], [1, 0.2], Extrapolation.CLAMP);
    return {
      opacity: interpolate(lift, [0, 100], [0.35, 0], Extrapolation.CLAMP),
      transform: [{ translateX: x + PLANE_W * 0.15 }, { scaleX: k }],
    };
  });
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: GROUND + 3,
          left: 0,
          width: PLANE_W * 0.7,
          height: 6,
          borderRadius: 6,
          backgroundColor: colors.ink,
        },
        style,
      ]}
    />
  );
}

function Puff({ p, width }: { p: SharedValue<number>; width: number }) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.get(), [0.58, 0.62, 0.85], [0, 0.9, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(p.get(), [0.58, 0.85], [0.4, 1.6], Extrapolation.CLAMP) }],
  }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: GROUND - 14,
          left: width * 0.42 + PLANE_W * 0.25,
          flexDirection: 'row',
          gap: 2,
        },
        style,
      ]}
    >
      {[10, 14, 9].map((s, i) => (
        <View
          key={i}
          style={{
            width: s,
            height: s,
            borderRadius: s,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.line,
          }}
        />
      ))}
    </Animated.View>
  );
}

function Sun({ x }: { x: number }) {
  const r = 46;
  const rays = Array.from({ length: 7 }, (_, i) => -180 + (i + 0.5) * (180 / 7));
  return (
    <Svg
      width={r * 2 + 48}
      height={r + 30}
      style={{ position: 'absolute', left: x - r - 24, top: GROUND - r - 28 }}
    >
      {rays.map((deg) => {
        const a = (deg * Math.PI) / 180;
        const cx = r + 24 + Math.cos(a) * (r + 14);
        const cy = r + 28 + Math.sin(a) * (r + 14);
        return (
          <Rect
            key={deg}
            x={cx - 5}
            y={cy - 7}
            width={10}
            height={14}
            rx={2}
            fill={colors.gold}
            transform={`rotate(${deg + 90} ${cx} ${cy})`}
          />
        );
      })}
      <Path
        d={`M${24} ${r + 28} A ${r} ${r} 0 0 1 ${2 * r + 24} ${r + 28} Z`}
        fill={colors.sun}
        stroke={colors.ember}
        strokeWidth={3}
      />
    </Svg>
  );
}

function Cloud({
  drift,
  width,
  top,
  size,
  offset,
}: {
  drift: SharedValue<number>;
  width: number;
  top: number;
  size: number;
  offset: number;
}) {
  const style = useAnimatedStyle(() => {
    const t = (drift.get() + offset) % 1;
    return { transform: [{ translateX: interpolate(t, [0, 1], [width, -size]) }] };
  });
  return (
    <Animated.View style={[{ position: 'absolute', top, left: 0 }, style]}>
      <Svg width={size} height={size * 0.5} viewBox="0 0 64 32">
        <Path
          d="M14 28 Q4 28 5 21 Q6 14 15 15 Q17 5 29 6 Q39 4 42 13 Q52 10 56 18 Q62 20 60 25 Q58 28 52 28 Z"
          fill={colors.surface}
          stroke={colors.line}
          strokeWidth={1.5}
        />
      </Svg>
    </Animated.View>
  );
}

function Runway({ width }: { width: number }) {
  return (
    <View style={{ position: 'absolute', top: GROUND, left: 0, width, height: HEIGHT - GROUND }}>
      <View style={{ height: 4, backgroundColor: colors.ink, borderRadius: 2 }} />
      <View style={{ flex: 1, backgroundColor: colors.line, justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', gap: 14, paddingLeft: 8 }}>
          {Array.from({ length: Math.ceil(width / 36) }, (_, i) => (
            <View
              key={i}
              style={{ width: 22, height: 3, borderRadius: 2, backgroundColor: colors.surface }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
