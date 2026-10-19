import { useState } from 'react';
import { Platform, Pressable, StyleSheet, type PressableProps } from 'react-native';
import { ControlSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ActionSurfaceProps = PressableProps & { busy?: boolean };

/** Shared interaction behavior; callers keep their visual variants and content. */
export function ActionSurface({
  busy = false, disabled, style, accessibilityState, accessibilityRole = 'button',
  onPress, onFocus, onBlur, ...props
}: ActionSurfaceProps) {
  const [focused, setFocused] = useState(false);
  const theme = useTheme();
  const blocked = !!disabled || busy || !!props['aria-disabled'] || !!accessibilityState?.disabled;
  return <Pressable
    {...props}
    accessibilityRole={accessibilityRole}
    accessibilityState={{ ...accessibilityState, disabled: blocked, busy: busy || !!accessibilityState?.busy }}
    aria-disabled={blocked}
    aria-busy={busy || !!accessibilityState?.busy || !!props['aria-busy']}
    aria-expanded={props['aria-expanded'] ?? accessibilityState?.expanded}
    aria-checked={props['aria-checked'] ?? accessibilityState?.checked}
    aria-selected={props['aria-selected'] ?? accessibilityState?.selected}
    disabled={blocked}
    onPress={(event) => { if (!blocked) onPress?.(event); }}
    onFocus={(event) => { setFocused(true); onFocus?.(event); }}
    onBlur={(event) => { setFocused(false); onBlur?.(event); }}
    style={(state) => [
      styles.target,
      state.pressed && !blocked && styles.pressed,
      typeof style === 'function' ? style({ ...state, pressed: state.pressed && !blocked }) : style,
      blocked && styles.disabled,
      focused && !blocked && Platform.select({ web: { outlineColor: theme.focusRing, outlineWidth: 2, outlineOffset: 2, outlineStyle: 'solid' as const } }),
    ]}
  />;
}

const styles = StyleSheet.create({
  target: { minWidth: ControlSize.touch, minHeight: ControlSize.touch },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
});
