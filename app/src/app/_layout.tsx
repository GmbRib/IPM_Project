import '../../global.css';

import {
  Baloo2_700Bold,
  Baloo2_800ExtraBold,
  useFonts as useBalooFonts,
} from '@expo-google-fonts/baloo-2';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts as useNunitoFonts,
} from '@expo-google-fonts/nunito';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ToastHost } from '@/components/ui';
import { useSession } from '@/stores/session';
import colors from '@/theme/colors';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [balooLoaded] = useBalooFonts({ Baloo2_700Bold, Baloo2_800ExtraBold });
  const [nunitoLoaded] = useNunitoFonts({ Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold });
  const status = useSession((s) => s.status);
  const onboarded = useSession((s) => s.user?.onboarded ?? false);
  const ready = balooLoaded && nunitoLoaded && status !== 'loading';

  useEffect(() => {
    useSession.getState().bootstrap();
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.cream }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.cream },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Protected guard={status === 'signedOut'}>
          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        </Stack.Protected>
        <Stack.Protected guard={status === 'signedIn' && !onboarded}>
          <Stack.Screen name="(onboarding)" options={{ animation: 'fade' }} />
        </Stack.Protected>
        <Stack.Protected guard={status === 'signedIn' && onboarded}>
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="day/[date]" />
          <Stack.Screen name="event/new" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="event/[id]" />
          <Stack.Screen name="trip/new" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="trip/[id]/mala" />
          <Stack.Screen name="trip/[id]/review" />
          <Stack.Screen name="historico" />
          <Stack.Screen name="perfil/documentos" />
          <Stack.Screen name="perfil/preferencias" />
          <Stack.Screen name="perfil/definicoes" />
        </Stack.Protected>
        {/* Used both during onboarding and from Perfil. */}
        <Stack.Protected guard={status === 'signedIn'}>
          <Stack.Screen name="document" options={{ animation: 'slide_from_bottom' }} />
        </Stack.Protected>
        <Stack.Protected guard={__DEV__}>
          <Stack.Screen name="dev/kit" />
        </Stack.Protected>
      </Stack>
      <ToastHost />
    </GestureHandlerRootView>
  );
}
