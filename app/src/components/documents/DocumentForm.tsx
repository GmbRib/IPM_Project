import { format, parseISO } from 'date-fns';
import { Trash2 } from 'lucide-react-native';
import { useRef, type ComponentRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { TextInput, View } from 'react-native';

import { FormTextField } from '@/components/form/FormFields';
import { Button, DateField } from '@/components/ui';
import type { DocumentType, TravelDocument } from '@/data/types';
import { confirm } from '@/lib/dialogs';
import { DOCUMENT_TYPES } from '@/lib/labels';
import { deletePhoto } from '@/lib/photos';
import { documentSchema, type DocumentValues } from '@/lib/validation';
import { zodResolver } from '@/lib/zodResolver';
import { useData } from '@/stores/data';
import { useSession } from '@/stores/session';
import { goBack } from '@/lib/navigation';

import { PhotoField } from './PhotoField';

type Props = {
  /** Editing an existing document… */
  doc?: TravelDocument;
  /** …or creating a new one of this type. */
  type?: DocumentType;
};

/** Add/edit form shared by onboarding and (later) Perfil → Os meus documentos. */
export function DocumentForm({ doc, type = 'cc' }: Props) {
  const userId = useSession((s) => s.user?.id);
  const { addDocument, updateDocument, removeDocument } = useData();
  const numberRef = useRef<ComponentRef<typeof TextInput>>(null);
  const originalPhoto = doc?.photoUri;

  const { control, handleSubmit, formState } = useForm<DocumentValues>({
    resolver: zodResolver(documentSchema),
    mode: 'onTouched',
    defaultValues: {
      type: doc?.type ?? type,
      name: doc?.name ?? (type === 'other' ? '' : DOCUMENT_TYPES[type].label),
      number: doc?.number ?? '',
      expiresAt: doc ? parseISO(doc.expiresAt) : (null as unknown as Date),
      photoUri: doc?.photoUri,
    },
  });

  async function save(v: DocumentValues) {
    if (!userId) return;
    const data = {
      type: v.type,
      name: v.name,
      number: v.number,
      expiresAt: format(v.expiresAt, 'yyyy-MM-dd'),
      photoUri: v.photoUri,
    };
    if (doc) await updateDocument(doc.id, data);
    else await addDocument({ ...data, userId });
    if (originalPhoto && originalPhoto !== v.photoUri) deletePhoto(originalPhoto);
    goBack();
  }

  async function remove() {
    if (!doc) return;
    const ok = await confirm({
      title: 'Eliminar documento?',
      message: `O documento "${doc.name}"${doc.photoUri ? ' e a sua foto vão ser apagados' : ' vai ser apagado'} deste telemóvel.`,
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      destructive: true,
    });
    if (!ok) return;
    await removeDocument(doc.id);
    deletePhoto(doc.photoUri);
    goBack();
  }

  return (
    <View className="gap-5">
      <Controller
        control={control}
        name="photoUri"
        render={({ field }) => <PhotoField value={field.value} onChange={field.onChange} />}
      />
      <FormTextField
        control={control}
        name="name"
        label="Nome"
        required
        placeholder="Ex.: Cartão de estudante"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => numberRef.current?.focus()}
      />
      <FormTextField
        control={control}
        name="number"
        label="Número"
        required
        ref={numberRef}
        placeholder="Como aparece no documento"
        autoCapitalize="characters"
        autoCorrect={false}
      />
      <Controller
        control={control}
        name="expiresAt"
        render={({ field, fieldState }) => (
          <DateField
            label="Validade"
            required
            value={field.value ?? null}
            onChange={(d) => {
              field.onChange(d);
              field.onBlur();
            }}
            error={fieldState.error?.message}
          />
        )}
      />
      <Button
        title="Guardar"
        fullWidth
        loading={formState.isSubmitting}
        onPress={handleSubmit(save)}
      />
      {doc && <Button title="Eliminar documento" variant="ghost" icon={Trash2} onPress={remove} />}
    </View>
  );
}
