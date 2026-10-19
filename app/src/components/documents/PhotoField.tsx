import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Images, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';

import { Banner, Button, Text } from '@/components/ui';
import { storePhoto } from '@/lib/photos';
import colors from '@/theme/colors';

type Props = {
  value?: string;
  onChange: (uri: string | undefined) => void;
};

/** Optional photo of a document: take one, pick from the gallery, replace or remove. */
export function PhotoField({ value, onChange }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function pick(source: 'camera' | 'library') {
    setError(undefined);
    if (source === 'camera' && Platform.OS !== 'web') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError(
          'Sem acesso à câmara. Podes dar acesso nas definições do telemóvel ou escolher da galeria.',
        );
        return;
      }
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: 'images', quality: 0.8 };
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled || !result.assets?.[0]) return;

    setBusy(true);
    try {
      onChange(await storePhoto(result.assets[0].uri));
    } catch {
      setError('Não foi possível guardar a foto. Tenta outra vez.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className="gap-2">
      <Text variant="label">Foto do documento (opcional)</Text>
      {busy ? (
        <View className="h-44 items-center justify-center rounded-card border-2 border-dashed border-line">
          <ActivityIndicator color={colors.ember} />
        </View>
      ) : value ? (
        <View className="gap-2">
          <Image
            source={{ uri: value }}
            style={{ width: '100%', height: 200, borderRadius: 20 }}
            contentFit="cover"
            accessibilityLabel="Foto do documento"
          />
          <View className="flex-row gap-2">
            <Button
              title="Substituir"
              variant="secondary"
              size="sm"
              icon={Camera}
              className="flex-1"
              onPress={() => pick(Platform.OS === 'web' ? 'library' : 'camera')}
            />
            <Button
              title="Remover"
              variant="ghost"
              size="sm"
              icon={Trash2}
              onPress={() => onChange(undefined)}
            />
          </View>
        </View>
      ) : (
        <View className="gap-2 rounded-card border-2 border-dashed border-line p-4">
          <Text variant="caption" className="text-center">
            Tens a foto sempre à mão, mesmo sem o documento.
          </Text>
          <View className="flex-row gap-2">
            <Button
              title="Tirar foto"
              size="sm"
              icon={Camera}
              className="flex-1"
              onPress={() => pick('camera')}
            />
            <Button
              title="Galeria"
              variant="secondary"
              size="sm"
              icon={Images}
              className="flex-1"
              onPress={() => pick('library')}
            />
          </View>
        </View>
      )}
      {!!error && <Banner tone="danger" message={error} />}
    </View>
  );
}
