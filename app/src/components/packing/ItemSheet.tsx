import { Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { BottomSheet, Button, Chip, Stepper, Text, TextField, Toggle } from '@/components/ui';
import type { Category, PackingItem } from '@/data/types';
import { CATEGORIES } from '@/lib/labels';

export type ItemDraft = Pick<PackingItem, 'name' | 'category' | 'quantity' | 'buyLater'>;

type Props = {
  open: boolean;
  /** Editing this item; leave out to add a new one. */
  item?: PackingItem;
  onClose: () => void;
  onSave: (draft: ItemDraft) => void;
  onDelete?: () => void;
};

const EMPTY: ItemDraft = { name: '', category: 'Roupa', quantity: 1, buyLater: false };

/** Add / edit a packing item (fluxo 2: "Adicionar" and "Editar"). */
export function ItemSheet({ open, item, onClose, onSave, onDelete }: Props) {
  return (
    <BottomSheet open={open} onClose={onClose} title={item ? 'Editar item' : 'Adicionar item'}>
      {/* The sheet unmounts its content when closed, so each opening starts fresh. */}
      <ItemForm item={item} onSave={onSave} onDelete={onDelete} />
    </BottomSheet>
  );
}

function ItemForm({ item, onSave, onDelete }: Pick<Props, 'item' | 'onSave' | 'onDelete'>) {
  const [draft, setDraft] = useState<ItemDraft>(() =>
    item
      ? {
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          buyLater: item.buyLater,
        }
      : EMPTY,
  );
  const [error, setError] = useState<string>();

  const set = <K extends keyof ItemDraft>(k: K, v: ItemDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  function save() {
    const name = draft.name.trim();
    if (!name) return setError('Escreve o nome do item');
    onSave({ ...draft, name });
  }

  return (
    <View className="gap-4">
      <TextField
        label="Nome"
        required
        value={draft.name}
        onChangeText={(t) => {
          set('name', t);
          if (error) setError(undefined);
        }}
        placeholder="Ex.: Protetor solar"
        autoCapitalize="sentences"
        error={error}
        returnKeyType="done"
        onSubmitEditing={save}
      />
      <View className="gap-2">
        <Text variant="label">Categoria</Text>
        <View className="flex-row flex-wrap gap-2">
          {CATEGORIES.map((c: Category) => (
            <Chip
              key={c}
              label={c}
              selected={draft.category === c}
              onPress={() => set('category', c)}
            />
          ))}
        </View>
      </View>
      <Stepper
        label="Quantidade"
        value={draft.quantity}
        onChange={(n) => set('quantity', n)}
        min={1}
        max={50}
      />
      <Toggle
        label="Comprar mais tarde"
        description="Aparece na lista de compras."
        value={draft.buyLater}
        onValueChange={(v) => set('buyLater', v)}
      />
      <Button title="Guardar" fullWidth onPress={save} />
      {item && onDelete && (
        <Button title="Eliminar item" variant="ghost" icon={Trash2} onPress={onDelete} />
      )}
    </View>
  );
}
