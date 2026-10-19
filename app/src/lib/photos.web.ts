import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// Web: picked files are blob: URLs that die on reload, so the photo is kept as a
// small JPEG data URI inside the document record itself (localStorage).

const MAX_WIDTH = 1000;

export async function storePhoto(pickedUri: string) {
  const image = await ImageManipulator.manipulate(pickedUri)
    .resize({ width: MAX_WIDTH, height: null })
    .renderAsync();
  const { base64 } = await image.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.6,
    base64: true,
  });
  return `data:image/jpeg;base64,${base64}`;
}

/** Nothing to clean up on web: the data lives in the record. */
export function deletePhoto(_uri: string | undefined) {}
