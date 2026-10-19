import { router } from 'expo-router';
import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { PlaneScene } from '@/components/animations/PlaneScene';
import { Logo } from '@/components/Logo';
import { Button, Screen, Text } from '@/components/ui';

export default function WelcomeScreen() {
  return (
    <Screen scroll className="flex-grow justify-between gap-6 py-6">
      <Animated.View entering={FadeIn.duration(600)} style={{ alignItems: 'center' }}>
        <Logo size={150} />
      </Animated.View>

      {/* Arriving in the app: the plane lands. */}
      <PlaneScene mode="landing">
        <Text variant="heading" className="text-center">
          A mala certa para cada viagem
        </Text>
      </PlaneScene>

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
