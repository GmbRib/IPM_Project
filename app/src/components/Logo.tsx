import { Image } from 'expo-image';

type LogoProps = { size?: number };

/** The Pack&Sun logo (transparent background). `size` is the height in points. */
export function Logo({ size = 160 }: LogoProps) {
  return (
    <Image
      source={require('@/assets/images/logo.png')}
      style={{ height: size, width: size * (336 / 366) }}
      contentFit="contain"
      accessibilityLabel="Pack&Sun"
    />
  );
}
