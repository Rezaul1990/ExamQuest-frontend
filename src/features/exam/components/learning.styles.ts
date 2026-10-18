import { StyleSheet } from 'react-native';
import { ExamQuestColors as C, Radius, Spacing } from '@/constants/theme';
export const learningStyles = StyleSheet.create({
  stack:{gap:Spacing.three}, row:{flexDirection:'row',flexWrap:'wrap',gap:Spacing.two},
  card:{padding:Spacing.three,gap:Spacing.two,borderWidth:1,borderColor:C.border,borderRadius:Radius.md,backgroundColor:C.surface},
  chip:{minWidth:44,minHeight:44,padding:Spacing.two,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:C.border,borderRadius:Radius.sm,backgroundColor:C.surface},
  selected:{borderColor:C.brandPrimary,backgroundColor:C.surfaceSelected}, marked:{borderColor:C.warning,borderWidth:2},
  scrim:{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',alignItems:'center',padding:Spacing.three},
  dialog:{width:'100%',maxWidth:600,maxHeight:'90%',padding:Spacing.three,borderRadius:Radius.md,backgroundColor:C.surface},
});
