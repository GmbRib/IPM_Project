import { randomUUID } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// Document photos on iOS/Android: shrunk, then copied out of the cache into the
// app's documents folder so the OS can't delete them. Web version: photos.web.ts.

const MAX_WIDTH = 1200;
const folder = new Directory(Paths.document, 'document-photos');

/** Shrinks a picked photo and stores it permanently. Returns the URI to save. */
export async function storePhoto(pickedUri: string) {
  const image = await ImageManipulator.manipulate(pickedUri)
    .resize({ width: MAX_WIDTH, height: null })
    .renderAsync();
  const { uri } = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.6 });

  folder.create({ idempotent: true, intermediates: true });
  const dest = new File(folder, `${randomUUID()}.jpg`);
  await new File(uri).copy(dest);
  return dest.uri;
}

/** Removes a stored photo; ignores URIs we didn't create. */
export function deletePhoto(uri: string | undefined) {
  if (!uri?.startsWith(folder.uri)) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Best effort: a leftover file is harmless.
  }
}
