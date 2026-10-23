import { View } from 'react-native';

import { useDialogs } from '@/lib/dialogs';

import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';

/**
 * Draws the confirmations and action lists asked for with `confirm()` / `showActions()`
 * where there's no system UI for them (web, and action lists on Android). Mounted once.
 */
export function DialogHost() {
  const pending = useDialogs((s) => s.confirm);
  const actions = useDialogs((s) => s.actions);

  const answer = (ok: boolean) => {
    pending?.resolve(ok);
    useDialogs.setState({ confirm: null });
  };
  const closeActions = () => useDialogs.setState({ actions: null });

  return (
    <>
      <ConfirmDialog
        open={!!pending}
        title={pending?.title ?? ''}
        message={pending?.message}
        confirmLabel={pending?.confirmLabel ?? ''}
        cancelLabel={pending?.cancelLabel}
        destructive={pending?.destructive}
        onConfirm={() => answer(true)}
        onCancel={() => answer(false)}
      />
      <BottomSheet open={!!actions} onClose={closeActions} title={actions?.title}>
        <View className="gap-3">
          {actions?.actions.map((a) => (
            <Button
              key={a.label}
              title={a.label}
              variant={a.destructive ? 'danger' : 'secondary'}
              fullWidth
              onPress={() => {
                closeActions();
                a.onPress();
              }}
            />
          ))}
        </View>
      </BottomSheet>
    </>
  );
}
