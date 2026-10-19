import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAuthStyles } from '@/features/auth/Auth.styles';

type WorkflowStep = {
  label: string;
  meta?: string;
};

type DashboardWorkflowPanelProps = {
  title: string;
  body: string;
  badge: string;
  progress?: number;
  steps: WorkflowStep[];
};

export function DashboardWorkflowPanel({ title, body, badge, progress, steps }: DashboardWorkflowPanelProps) {
  const authStyles = useAuthStyles();
  return (
    <View style={authStyles.dashboardFeaturePanel}>
      <View style={authStyles.dashboardFeatureHeader}>
        <View style={authStyles.dashboardFeatureCopy}>
          <ThemedText type="smallBold">{title}</ThemedText>
          <ThemedText type="caption" style={authStyles.mutedText}>{body}</ThemedText>
        </View>
        <View style={authStyles.dashboardFeatureBadge}>
          <ThemedText type="caption" style={authStyles.dashboardFeatureBadgeText}>{badge}</ThemedText>
        </View>
      </View>
      {typeof progress === 'number' && (
        <View style={authStyles.dashboardProgressTrack}>
          <View style={[authStyles.dashboardProgressFill, { width: `${Math.max(0, Math.min(100, progress))}%` }]} />
        </View>
      )}
      <View style={authStyles.dashboardStepRail}>
        {steps.map((step, index) => (
          <View key={`${step.label}-${index}`} style={authStyles.dashboardStepItem}>
            <View
              style={[
                authStyles.dashboardStepMarker,
                index === 1 && authStyles.dashboardStepMarkerAmber,
                index === 2 && authStyles.dashboardStepMarkerBlue,
              ]}>
              <ThemedText type="caption" style={authStyles.dashboardStepMarkerText}>{index + 1}</ThemedText>
            </View>
            <View style={authStyles.dashboardStepCopy}>
              <ThemedText type="caption" style={authStyles.dashboardCardTitle}>{step.label}</ThemedText>
              {!!step.meta && <ThemedText type="caption" style={authStyles.mutedText}>{step.meta}</ThemedText>}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
