import { Luggage, Plus, Trash2 } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { PlaneScene } from '@/components/animations/PlaneScene';
import {
  BottomSheet,
  Button,
  Card,
  Chip,
  DateField,
  EmptyState,
  Header,
  IconButton,
  ProgressBar,
  Screen,
  SegmentedControl,
  Stepper,
  Text,
  TextField,
  Toggle,
} from '@/components/ui';
import colors from '@/theme/colors';

const ACTIVITIES = ['Caminhadas', 'Praia', 'Jantar fora', 'Reunião', 'Museus', 'Desporto'];
const SWATCHES = Object.entries(colors);

/** Dev-only catalogue of the base components, so everyone can try them on a phone. */
export default function KitScreen() {
  const [name, setName] = useState('');
  const [allergies, setAllergies] = useState(false);
  const [people, setPeople] = useState(1);
  const [purpose, setPurpose] = useState<'leisure' | 'work'>('leisure');
  const [picked, setPicked] = useState<string[]>(['Praia']);
  const [date, setDate] = useState<Date | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [replay, setReplay] = useState(0);

  const togglePick = (a: string) =>
    setPicked((p) => (p.includes(a) ? p.filter((x) => x !== a) : [...p, a]));

  return (
    <Screen scroll>
      <Header leading="back" title="Componentes" subtitle="Fase 0 · catálogo de UI" />

      <Section title="Animações">
        <PlaneScene key={`t${replay}`} mode="takeoff">
          <Text variant="caption">Descolar (ao criar uma viagem)</Text>
        </PlaneScene>
        <PlaneScene key={`l${replay}`} mode="landing">
          <Text variant="caption">Aterrar (ao abrir a app e no fim de uma viagem)</Text>
        </PlaneScene>
        <Button title="Repetir" variant="secondary" onPress={() => setReplay((r) => r + 1)} />
      </Section>

      <Section title="Cores">
        <View className="flex-row flex-wrap gap-2">
          {SWATCHES.map(([token, hex]) => (
            <View key={token} className="w-[30%] gap-1">
              <View
                className="h-12 rounded-xl border border-line"
                style={{ backgroundColor: hex }}
              />
              <Text variant="caption">{token}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Texto">
        <Text variant="title">Título</Text>
        <Text variant="heading">Cabeçalho</Text>
        <Text>Corpo de texto normal.</Text>
        <Text variant="label">Etiqueta</Text>
        <Text variant="caption">Legenda secundária</Text>
        <Text variant="link">Ligação</Text>
      </Section>

      <Section title="Botões">
        <Button title="Continuar" fullWidth />
        <Button title="Voltar ao passo anterior" variant="secondary" fullWidth />
        <Button title="Adicionar item" variant="ghost" icon={Plus} />
        <Button title="Eliminar" variant="danger" icon={Trash2} />
        <Button title="A carregar" loading />
        <Button title="Desativado" disabled />
        <View className="flex-row gap-2">
          <IconButton icon={Plus} accessibilityLabel="Nova viagem" variant="filled" />
          <IconButton icon={Trash2} accessibilityLabel="Eliminar" color={colors.danger} />
        </View>
      </Section>

      <Section title="Formulários">
        <TextField
          label="Como te chamas?"
          required
          placeholder="O teu nome"
          value={name}
          onChangeText={setName}
          error={name.length === 1 ? 'O nome é demasiado curto' : undefined}
        />
        <DateField label="Ida" value={date} onChange={setDate} minimumDate={new Date()} />
        <Toggle
          label="Tenho alergias"
          description="Juntamos o que precisas à mala"
          value={allergies}
          onValueChange={setAllergies}
        />
        <Stepper label="Número de pessoas" value={people} onChange={setPeople} min={1} max={20} />
        <SegmentedControl
          label="Motivo"
          value={purpose}
          onChange={setPurpose}
          options={[
            { value: 'leisure', label: 'Lazer' },
            { value: 'work', label: 'Trabalho' },
          ]}
        />
        <View className="flex-row flex-wrap gap-2">
          {ACTIVITIES.map((a) => (
            <Chip key={a} label={a} selected={picked.includes(a)} onPress={() => togglePick(a)} />
          ))}
        </View>
      </Section>

      <Section title="Cartões">
        <Card title="A tua mala" onPress={() => setSheetOpen(true)}>
          <Text className="mb-2">10/24 itens arrumados</Text>
          <ProgressBar value={10 / 24} accessibilityLabel="Progresso da mala" />
        </Card>
        <Card>
          <Text>Cartão sem ação.</Text>
        </Card>
      </Section>

      <Section title="Estado vazio">
        <EmptyState
          icon={Luggage}
          title="Ainda não tens viagens"
          message="Cria a primeira e geramos a mala por ti."
          actionLabel="Abrir folha"
          onAction={() => setSheetOpen(true)}
        />
      </Section>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Adicionar item">
        <View className="gap-4">
          <TextField label="Nome" placeholder="Ex.: Protetor solar" />
          <Stepper label="Quantidade" value={people} onChange={setPeople} min={1} />
          <Button title="Guardar" fullWidth onPress={() => setSheetOpen(false)} />
        </View>
      </BottomSheet>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mt-6 gap-3">
      <Text variant="heading">{title}</Text>
      {children}
    </View>
  );
}
