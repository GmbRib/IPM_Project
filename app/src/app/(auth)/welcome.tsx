import { router } from 'expo-router';
import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { PlaneScene } from '@/components/animations/PlaneScene';
import { Logo } from '@/components/Logo';
import { Button, Screen, Text } from '@/components/ui';

export default function WelcomeScreen() {
  return (
    // Two blocks: the brand at the top, the actions at the bottom. Nothing floats in between.
    <Screen scroll className="flex-grow justify-between gap-8 pt-6">
      <View className="gap-6">
        <Animated.View entering={FadeIn.duration(600)} style={{ alignItems: 'center' }}>
          <Logo size={140} />
        </Animated.View>

        {/* Arriving in the app: the plane lands. */}
        <PlaneScene mode="landing">
          <Text variant="heading" className="text-center">
            A mala certa para cada viagem
          </Text>
        </PlaneScene>
      </View>

      <Animated.View entering={FadeInDown.delay(500).duration(450)}>
        <View className="gap-3">
          <Button title="Criar conta" fullWidth onPress={() => router.push('/register')} />
          <Button
            title="Já tenho conta"
            variant="secondary"
            fullWidth
            onPress={() => router.push('/login')}
          />
        </View>
      </Animated.View>
    </Screen>
  );
}
