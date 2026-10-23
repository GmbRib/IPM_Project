import { router, type Href } from 'expo-router';
import {
  ChevronRight,
  FileText,
  History,
  LogOut,
  RotateCcw,
  Settings,
  Shapes,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Button, Card, FadeInView, Header, Screen, Text } from '@/components/ui';
import { documentStatus, pastTrips } from '@/data/selectors';
import { useData } from '@/stores/data';
import { useSession } from '@/stores/session';
import colors from '@/theme/colors';

export default function PerfilScreen() {
  const user = useSession((s) => s.user);
  const logout = useSession((s) => s.logout);
  const resetDemo = useSession((s) => s.resetDemo);
  const trips = useData((s) => s.trips);
  const documents = useData((s) => s.documents);

  const done = pastTrips(trips).length;
  const attention = documents.filter((d) => documentStatus(d) !== 'valid').length;
  const c = user?.conditions;
  const needs = [
    c?.wheelchair && 'cadeira de rodas',
    c?.allergies.length && `alergias (${c.allergies.join(', ')})`,
    c?.medication.length && 'medicação',
  ].filter(Boolean);

  return (
    <Screen edges={['top']} scroll>
      <Header title="Perfil" />
      <FadeInView>
        <Card>
          <View className="flex-row items-center gap-4">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-sun">
              <Text variant="title">{user?.name.charAt(0).toUpperCase() || '?'}</Text>
            </View>
            <View className="flex-1">
              <Text variant="heading">{user?.name || 'Sem nome'}</Text>
              <Text variant="caption">{user?.email}</Text>
              <Text variant="caption">
                {done === 1 ? '1 viagem feita' : `${done} viagens feitas`}
              </Text>
            </View>
          </View>
        </Card>
      </FadeInView>

      <FadeInView index={1}>
        <View className="mt-4 overflow-hidden rounded-card border border-line bg-surface">
          <Row
            icon={FileText}
            title="Os meus documentos"
            subtitle={
              documents.length === 0
                ? 'Nenhum guardado'
                : `${documents.length} ${documents.length === 1 ? 'documento' : 'documentos'}${attention ? ` · ${attention} a precisar de atenção` : ''}`
            }
            alert={attention > 0}
            href="/perfil/documentos"
          />
          <Row
            icon={SlidersHorizontal}
            title="Preferências de viagem"
            subtitle={needs.length ? `Nome, ${needs.join(', ')}` : 'Nome e necessidades especiais'}
            href="/perfil/preferencias"
          />
          <Row
            icon={History}
            title="Histórico"
            subtitle="O que aprendemos com as tuas viagens"
            href="/historico"
          />
          <Row
            icon={Settings}
            title="Definições"
            subtitle="Temperatura, lembretes"
            href="/perfil/definicoes"
          />
        </View>
      </FadeInView>

      <View className="mt-8">
        <Button
          title="Terminar sessão"
          variant="secondary"
          icon={LogOut}
          fullWidth
          onPress={logout}
        />
      </View>
      {__DEV__ && (
        <View className="mt-10 items-start gap-1 border-t border-line pt-4">
          <Text variant="caption" className="font-body-bold">
            Desenvolvimento
          </Text>
          <Button
            title="Ver componentes (dev)"
            variant="ghost"
            icon={Shapes}
            onPress={() => router.push('/dev/kit')}
          />
          <Button
            title="Repor dados de demonstração (dev)"
            variant="ghost"
            icon={RotateCcw}
            onPress={resetDemo}
          />
        </View>
      )}
    </Screen>
  );
}

function Row({
  icon: Icon,
  title,
  subtitle,
  href,
  alert,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  href: Href;
  alert?: boolean;
}) {
  return (
    <Pressable
      onPress={() => router.push(href)}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      className="min-h-16 flex-row items-center gap-3 border-b border-line px-4 py-3 active:bg-sun-soft"
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-sun-soft">
        <Icon size={20} color={colors.ember} />
      </View>
      <View className="flex-1">
        <Text variant="label">{title}</Text>
        <Text variant="caption" className={alert ? 'font-body-bold text-ember-text' : undefined}>
          {subtitle}
        </Text>
      </View>
      <ChevronRight size={20} color={colors.muted} />
    </Pressable>
  );
}
