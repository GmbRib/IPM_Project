import { Tabs } from 'expo-router';
import { CalendarDays, Plane, UserRound } from 'lucide-react-native';

import colors from '@/theme/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        sceneStyle: { backgroundColor: colors.cream },
        tabBarActiveTintColor: colors['ember-text'],
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          minHeight: 64,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: 'Nunito_700Bold', fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="viagens"
        options={{ title: 'Viagens', tabBarIcon: ({ color }) => <Plane size={24} color={color} /> }}
      />
      <Tabs.Screen
        name="calendario"
        options={{
          title: 'Calendário',
          tabBarIcon: ({ color }) => <CalendarDays size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <UserRound size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
