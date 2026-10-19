import { useThemeScheme } from '@/hooks/use-theme';
import { StyleSheet } from 'react-native';
import { Colors, type ThemePalette, Radius, Spacing } from '@/constants/theme';
export function createStyles(C: ThemePalette) { return StyleSheet.create({
  stack:{gap:Spacing.three}, row:{flexDirection:'row',flexWrap:'wrap',gap:Spacing.two},
  card:{padding:Spacing.three,gap:Spacing.two,borderWidth:1,borderColor:C.border,borderRadius:Radius.md,backgroundColor:C.surface},
  chip:{minWidth:44,minHeight:44,padding:Spacing.two,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:C.border,borderRadius:Radius.sm,backgroundColor:C.surface},
  answerOption:{alignItems:'stretch',padding:Spacing.twoHalf},
  selected:{borderColor:C.brandPrimary,backgroundColor:C.surfaceSelected}, marked:{borderColor:C.warning,borderWidth:2},
  scrim:{flex:1,backgroundColor: C.scrim,justifyContent:'center',alignItems:'center',padding:Spacing.three},
  dialog:{width:'100%',maxWidth:600,maxHeight:'90%',padding:Spacing.three,borderRadius:Radius.md,backgroundColor:C.surface},
}); }
const byScheme = { light: createStyles(Colors.light), dark: createStyles(Colors.dark) };
export const learningStyles = byScheme.light;
export function useLearningStyles() { return byScheme[useThemeScheme()]; }
