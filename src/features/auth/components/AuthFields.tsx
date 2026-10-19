import { useState } from 'react';
import type { ReactNode } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { ActionSurface } from '@/components/ui/ActionSurface';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStyles } from '@/features/auth/Auth.styles';

type TextFieldProps = TextInputProps & {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  helperText?: string;
  errorText?: string | null;
  showPasswordToggle?: boolean;
};

export function AuthTextField({ label, helperText, errorText, showPasswordToggle, secureTextEntry, style, ...props }: TextFieldProps) {
  const authStyles = useAuthStyles();
  const [visible, setVisible] = useState(false);
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const isSecure = secureTextEntry && !visible;

  return (
    <View style={authStyles.fieldGroup}>
      <ThemedText type="smallBold" style={{ color: theme.textPrimary }}>
        {label}
      </ThemedText>
      <View style={[authStyles.inputShell, { backgroundColor: errorText ? theme.errorSoft : theme.surface, borderColor: errorText ? theme.error : focused ? theme.focusRing : theme.borderStrong }]}>
        <TextInput
          autoCapitalize="none"
          allowFontScaling
          maxFontSizeMultiplier={0}
          placeholderTextColor={theme.textMuted}
          secureTextEntry={isSecure}
          style={[authStyles.input, { color: theme.textPrimary }, style]}
          accessibilityLabel={label}
          {...props}
          onFocus={(event) => { setFocused(true); props.onFocus?.(event); }}
          onBlur={(event) => { setFocused(false); props.onBlur?.(event); }}
        />
        {showPasswordToggle && (
          <ActionSurface
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            onPress={() => setVisible((current) => !current)}
            style={authStyles.inputAction}>
            <ThemedText type="smallBold" style={{ color: theme.brandPrimary }}>
              {visible ? 'Hide' : 'Show'}
            </ThemedText>
          </ActionSurface>
        )}
      </View>
      {helperText && !errorText && (
        <ThemedText type="caption" style={{ color: theme.textMuted }}>
          {helperText}
        </ThemedText>
      )}
      {errorText && (
        <ThemedText type="caption" style={[authStyles.error, { color: theme.error, backgroundColor: theme.errorSoft, borderColor: theme.error }]}>
          {errorText}
        </ThemedText>
      )}
    </View>
  );
}

export function AuthHero({
  kicker,
  body,
  badges = [],
  preview = 'exam',
  children,
}: {
  kicker: string;
  title: string;
  body: string;
  badges?: string[];
  preview?: 'exam' | 'access' | 'account' | null;
  children?: ReactNode;
}) {
  const authStyles = useAuthStyles();
  return (
    <View style={authStyles.brandHero}>
      <View style={authStyles.heroAccent} />
      <View style={authStyles.brandRow}>
        <View style={authStyles.brandMark}>
          <ThemedText style={authStyles.brandMarkText}>EQ</ThemedText>
        </View>
        <View style={authStyles.brandCopy}>
          <ThemedText type="caption" style={authStyles.headerKicker}>
            {kicker}
          </ThemedText>
        </View>
      </View>
      <ThemedText type="small" style={authStyles.headerBody}>
        {body}
      </ThemedText>
      {!!badges.length && (
        <View style={authStyles.heroMetaRow}>
          {badges.map((badge) => (
            <StatusBadge key={badge} label={badge} />
          ))}
        </View>
      )}
      {preview && <HeroPreview variant={preview} />}
      {children}
    </View>
  );
}

function HeroPreview({ variant }: { variant: 'exam' | 'access' | 'account' }) {
  const authStyles = useAuthStyles();
  if (variant === 'access') {
    return (
      <View style={authStyles.heroPreview}>
        <View style={authStyles.previewHeader}>
          <ThemedText type="caption" style={authStyles.mutedText}>Access matrix</ThemedText>
          <View style={authStyles.previewChip}>
            <ThemedText type="caption" style={authStyles.previewChipText}>ADMIN</ThemedText>
          </View>
        </View>
        <View style={authStyles.previewStaffRow}>
          <View style={authStyles.previewAvatar}>
            <ThemedText type="caption" style={authStyles.previewAvatarText}>ST</ThemedText>
          </View>
          <View style={authStyles.previewStaffCopy}>
            <ThemedText type="smallBold">Staff role builder</ThemedText>
            <ThemedText type="caption" style={authStyles.mutedText}>Content + exam access</ThemedText>
          </View>
          <View style={authStyles.previewPermissionBars}>
            <View style={[authStyles.previewPermissionBar, authStyles.previewPermissionBarActive]} />
            <View style={[authStyles.previewPermissionBar, authStyles.previewPermissionBarActive]} />
            <View style={authStyles.previewPermissionBar} />
          </View>
        </View>
        <View style={authStyles.previewMatrix}>
          {[true, true, false, true, false, true].map((active, index) => (
            <View
              key={`${active}-${index}`}
              style={[authStyles.previewMatrixCell, active && authStyles.previewMatrixCellActive]}
            />
          ))}
        </View>
        <View style={authStyles.previewMiniStats}>
          <View style={authStyles.previewMiniStat}>
            <ThemedText type="caption" style={authStyles.mutedText}>Selected</ThemedText>
            <ThemedText type="smallBold" style={authStyles.previewMiniStatValue}>4 access</ThemedText>
          </View>
          <View style={authStyles.previewMiniStat}>
            <ThemedText type="caption" style={authStyles.mutedText}>Protected</ThemedText>
            <ThemedText type="smallBold" style={authStyles.previewMiniStatValue}>Admin only</ThemedText>
          </View>
        </View>
      </View>
    );
  }

  if (variant === 'account') {
    return (
      <View style={authStyles.heroPreview}>
        <View style={authStyles.previewHeader}>
          <ThemedText type="caption" style={authStyles.mutedText}>Account status</ThemedText>
          <View style={authStyles.previewChip}>
            <ThemedText type="caption" style={authStyles.previewChipText}>ACTIVE</ThemedText>
          </View>
        </View>
        <View style={authStyles.previewAccountRow}>
          <View style={authStyles.previewCheck}>
            <ThemedText type="caption" style={authStyles.previewCheckText}>OK</ThemedText>
          </View>
          <View style={authStyles.previewStaffCopy}>
            <ThemedText type="smallBold">Ready for login</ThemedText>
            <ThemedText type="caption" style={authStyles.mutedText}>Session and account are clear</ThemedText>
          </View>
        </View>
        <View style={[authStyles.previewLine, authStyles.previewLineStrong]} />
        <View style={[authStyles.previewLine, authStyles.previewLineShort]} />
        <View style={authStyles.previewMiniStats}>
          <View style={authStyles.previewMiniStat}>
            <ThemedText type="caption" style={authStyles.mutedText}>Status</ThemedText>
            <ThemedText type="smallBold" style={authStyles.previewMiniStatValue}>Verified</ThemedText>
          </View>
          <View style={authStyles.previewMiniStat}>
            <ThemedText type="caption" style={authStyles.mutedText}>Role</ThemedText>
            <ThemedText type="smallBold" style={authStyles.previewMiniStatValue}>Member</ThemedText>
          </View>
        </View>
        <View style={authStyles.previewProgressTrack}>
          <View style={authStyles.previewProgressFill} />
        </View>
      </View>
    );
  }

  return (
    <View style={authStyles.heroPreview}>
      <View style={authStyles.previewHeader}>
        <ThemedText type="caption" style={authStyles.mutedText}>Live exam preview</ThemedText>
        <View style={authStyles.previewChip}>
          <ThemedText type="caption" style={authStyles.previewChipText}>Q1</ThemedText>
        </View>
      </View>
      <View style={[authStyles.previewLine, authStyles.previewLineStrong]} />
      <View style={[authStyles.previewLine, authStyles.previewLineShort]} />
      <View style={authStyles.previewOptionRow}>
        <View style={authStyles.previewOption}>
          <ThemedText type="caption" style={authStyles.previewOptionText}>A</ThemedText>
        </View>
        <View style={[authStyles.previewOption, authStyles.previewOptionActive]}>
          <ThemedText type="caption" style={authStyles.previewOptionTextActive}>B selected</ThemedText>
        </View>
        <View style={authStyles.previewOption}>
          <ThemedText type="caption" style={authStyles.previewOptionText}>C</ThemedText>
        </View>
      </View>
      <View style={authStyles.previewMiniStats}>
        <View style={authStyles.previewMiniStat}>
          <ThemedText type="caption" style={authStyles.mutedText}>Progress</ThemedText>
          <ThemedText type="smallBold" style={authStyles.previewMiniStatValue}>7 / 25</ThemedText>
        </View>
        <View style={authStyles.previewMiniStat}>
          <ThemedText type="caption" style={authStyles.mutedText}>Mode</ThemedText>
          <ThemedText type="smallBold" style={authStyles.previewMiniStatValue}>MCQ</ThemedText>
        </View>
      </View>
      <View style={authStyles.previewProgressTrack}>
        <View style={authStyles.previewProgressFill} />
      </View>
      <View style={authStyles.previewDots}>
        <View style={[authStyles.previewDot, authStyles.previewDotActive]} />
        <View style={authStyles.previewDot} />
        <View style={authStyles.previewDot} />
      </View>
    </View>
  );
}

export function StatusBadge({ label }: { label: string }) {
  const authStyles = useAuthStyles();
  return (
    <View style={authStyles.statusBadge}>
      <ThemedText type="caption" style={authStyles.statusBadgeText}>
        {label}
      </ThemedText>
    </View>
  );
}

export function FormStepHeader({ number, title, body }: { number: string; title: string; body: string }) {
  const authStyles = useAuthStyles();
  return (
    <View style={authStyles.stepHeader}>
      <View style={authStyles.stepNumber}>
        <ThemedText style={authStyles.stepNumberText}>{number}</ThemedText>
      </View>
      <View style={authStyles.stepCopy}>
        <ThemedText type="sectionTitle">{title}</ThemedText>
        <ThemedText type="small" style={authStyles.mutedText}>
          {body}
        </ThemedText>
      </View>
    </View>
  );
}

export function AuthButton({
  label,
  onPress,
  disabled,
  busy,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  const authStyles = useAuthStyles();
  const theme = useTheme();
  return (
    <ActionSurface
      accessibilityRole="button"
      disabled={disabled}
      busy={busy}
      onPress={onPress}
      style={({ pressed }) => [
        authStyles.button,
        variant === 'secondary' && authStyles.secondaryButton,
        variant === 'danger' && authStyles.dangerButton,
        { backgroundColor: variant === 'secondary' ? (pressed ? theme.surfaceSelected : theme.surface) : variant === 'danger' ? (pressed ? theme.errorPressed : theme.error) : (pressed ? theme.brandPressed : theme.brandPrimary), borderColor: theme.borderStrong },
      ]}>
      <ThemedText style={[authStyles.buttonText, { color: variant === 'secondary' ? theme.textPrimary : variant === 'danger' ? theme.onError : theme.onBrandPrimary }]}>
        {label}
      </ThemedText>
    </ActionSurface>
  );
}

export function ScreenStat({ label, value }: { label: string; value: string }) {
  const authStyles = useAuthStyles();
  return (
    <View style={authStyles.statItem}>
      <ThemedText type="caption" style={authStyles.mutedText}>
        {label}
      </ThemedText>
      <ThemedText type="sectionTitle">{value}</ThemedText>
    </View>
  );
}
