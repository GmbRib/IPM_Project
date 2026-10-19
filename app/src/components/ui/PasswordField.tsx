import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';

import colors from '@/theme/colors';

import { IconButton } from './IconButton';
import { TextField, type TextFieldProps } from './TextField';

/** TextField with a show/hide toggle. */
export function PasswordField(props: Omit<TextFieldProps, 'secureTextEntry' | 'trailing'>) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      trailing={
        <IconButton
          icon={visible ? EyeOff : Eye}
          accessibilityLabel={visible ? 'Esconder palavra-passe' : 'Mostrar palavra-passe'}
          color={colors.muted}
          onPress={() => setVisible((v) => !v)}
          className="mr-1"
        />
      }
    />
  );
}
