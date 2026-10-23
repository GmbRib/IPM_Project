import { ActionSheetIOS, Alert, Platform } from 'react-native';
import { create } from 'zustand';

// One way to ask the user something, everywhere:
// - iOS/Android: the system alert (Liquid Glass on iOS 26) and, on iOS, the system action sheet.
// - Web (where Alert doesn't work) and Android action lists: our own UI, drawn by <DialogHost />.

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel: string;
  /** Leave out for a single-button notice. */
  cancelLabel?: string;
  destructive?: boolean;
};

export type Action = { label: string; destructive?: boolean; onPress: () => void };

type DialogState = {
  confirm: (ConfirmOptions & { resolve: (ok: boolean) => void }) | null;
  actions: { title?: string; actions: Action[] } | null;
};

export const useDialogs = create<DialogState>()(() => ({ confirm: null, actions: null }));

/** Resolves true when the user confirms. */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      useDialogs.setState({ confirm: { ...options, resolve } });
      return;
    }
    const buttons: Parameters<typeof Alert.alert>[2] = [];
    if (options.cancelLabel) {
      buttons.push({ text: options.cancelLabel, style: 'cancel', onPress: () => resolve(false) });
    }
    buttons.push({
      text: options.confirmLabel,
      style: options.destructive ? 'destructive' : 'default',
      onPress: () => resolve(true),
    });
    Alert.alert(options.title, options.message, buttons, {
      cancelable: true,
      onDismiss: () => resolve(false),
      // The app is light-only; follow it rather than the phone's dark mode.
      userInterfaceStyle: 'light',
    });
  });
}

/** A short list of actions (e.g. the trip "⋯" menu). */
export function showActions(title: string | undefined, actions: Action[]) {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        options: [...actions.map((a) => a.label), 'Cancelar'],
        cancelButtonIndex: actions.length,
        destructiveButtonIndex: actions.flatMap((a, i) => (a.destructive ? [i] : [])),
        userInterfaceStyle: 'light',
      },
      (index) => actions[index]?.onPress(),
    );
    return;
  }
  useDialogs.setState({ actions: { title, actions } });
}
