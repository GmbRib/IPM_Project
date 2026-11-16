import { ChevronRight, ListChecks, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { ItemSheet, type ItemDraft } from '@/components/packing/ItemSheet';
import { Button, EmptyState, Header, Screen, Text } from '@/components/ui';
import type { PresetItem } from '@/data/types';
import { CATEGORIES } from '@/lib/labels';
import { useSession } from '@/stores/session';
import { useUi } from '@/stores/ui';
import colors from '@/theme/colors';

/** Which item the sheet is showing: an index into the preset, or a new one. */
type Editing = { index: number } | 'new' | null;

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

// "Os meus itens": what the user always packs. Copied into every new bag, on top of the
// suggestions (src/domain/packing.ts). Editing it never changes bags that already exist.
export default function MeusItensScreen() {
  const preset = useSession((s) => s.user?.presetItems) ?? [];
  const updateUser = useSession((s) => s.updateUser);
  const showToast = useUi((s) => s.showToast);
  const [editing, setEditing] = useState<Editing>(null);

  const current = editing && editing !== 'new' ? preset[editing.index] : undefined;

  async function save(next: PresetItem[], message: string) {
    setEditing(null);
    try {
      await updateUser({ presetItems: next });
      showToast({ message });
    } catch {
      // The store already said what went wrong.
    }
  }

  function onSave({ name, category, quantity }: ItemDraft) {
    const item: PresetItem = { name, category, quantity };
    const index = editing && editing !== 'new' ? editing.index : -1;
    // One line per item: saving a name that's already on the list replaces that line.
    const dup = preset.findIndex((p, i) => i !== index && sameName(p.name, name));
    const next = preset.filter((_, i) => i !== dup);
    const at = index === -1 ? -1 : next.indexOf(preset[index]);
    if (at === -1) next.push(item);
    else next[at] = item;
    save(
      next,
      dup !== -1 ? `${name} atualizado` : index === -1 ? `${name} adicionado` : 'Guardado',
    );
  }

  function onDelete() {
    if (!editing || editing === 'new') return;
    const removed = preset[editing.index];
    save(
      preset.filter((_, i) => i !== editing.index),
      `${removed.name} removido`,
    );
  }

  const groups = CATEGORIES.map((category) => ({
    category,
    items: preset
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.category === category),
  })).filter((g) => g.items.length);

  return (
    <Screen scroll>
      <Header
        leading="back"
        title="Os meus itens"
        subtitle="Entram em todas as malas novas, junto com as sugestões."
      />
      <View className="gap-6">
        {preset.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="Ainda sem itens"
            message="Junta aqui o que levas sempre, como o teu creme ou os auriculares. Não precisas de os adicionar à mão em cada viagem."
          />
        ) : (
          groups.map(({ category, items }) => (
            <View key={category} className="gap-2">
              <Text variant="label" className="text-muted">
                {category}
              </Text>
              <View className="overflow-hidden rounded-card border border-line bg-surface">
                {items.map(({ item, index }, i) => (
                  <Pressable
                    key={item.name}
                    onPress={() => setEditing({ index })}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.name}, quantidade ${item.quantity}. Editar`}
                    className={`min-h-14 flex-row items-center gap-3 px-4 py-3 active:bg-sun-soft ${i ? 'border-t border-line' : ''}`}
                  >
                    <Text className="flex-1">{item.name}</Text>
                    <Text variant="caption">×{item.quantity}</Text>
                    <ChevronRight size={20} color={colors.muted} />
                  </Pressable>
                ))}
              </View>
            </View>
          ))
        )}
        <Button title="Adicionar item" icon={Plus} fullWidth onPress={() => setEditing('new')} />
        {preset.length > 0 && (
          <Text variant="caption" className="text-center">
            Alterar esta lista não muda as malas que já criaste.
          </Text>
        )}
      </View>

      <ItemSheet
        open={editing !== null}
        item={current}
        onClose={() => setEditing(null)}
        onSave={onSave}
        onDelete={onDelete}
        showBuyLater={false}
      />
    </Screen>
  );
}
