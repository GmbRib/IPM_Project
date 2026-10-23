import { NativeTabs } from 'expo-router/native-tabs';

import colors from '@/theme/colors';

/**
 * iOS/Android: the system tab bar. On iOS 26 it's drawn in Liquid Glass and shrinks
 * while scrolling down. The web version lives in _layout.web.tsx.
 */
export default function TabsLayout() {
  return (
    <NativeTabs
      tintColor={colors['ember-text']}
      minimizeBehavior="onScrollDown"
      // iOS 18 and older / Android only (iOS 26 glass picks its own background).
      backgroundColor={colors.surface}
      indicatorColor={colors['sun-soft']}
    >
      <NativeTabs.Trigger name="viagens">
        <NativeTabs.Trigger.Label>Viagens</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="airplane" md="flight" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="calendario">
        <NativeTabs.Trigger.Label>Calendário</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="perfil">
        <NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
          md="person"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
