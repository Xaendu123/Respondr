/**
 * MY ACTIVITIES SCREEN
 * 
 * Displays all activities logged by the current user.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { RefreshControl, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Text } from '../components/ui';
import { useActivities } from '../hooks/useActivities';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import { formatDurationWithTranslation } from '../utils/formatDuration';

export function MyActivitiesScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { activities, loading, refresh } = useActivities('mine');
  
  const styles = createStyles(theme);
  
  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'training': return theme.colors.info;
      case 'exercise': return theme.colors.warning;
      case 'operation': return theme.colors.error;
      default: return theme.colors.primary;
    }
  };
  
  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'training': return 'book-outline';
      case 'exercise': return 'fitness-outline';
      case 'operation': return 'flash-outline';
      default: return 'flag-outline';
    }
  };
  
  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'training': return t('activity.typeTraining');
      case 'exercise': return t('activity.typeExercise');
      case 'operation': return t('activity.typeOperation');
      default: return type;
    }
  };
  
  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.emptyState}>
          <Ionicons name="person-circle-outline" size={80} color={theme.colors.textTertiary} />
          <Text variant="headingMedium" color="textSecondary" style={styles.emptyText}>
            {t('profile.notLoggedIn')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.gradientStart} translucent={true} />
      {/* Header with Gradient */}
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text variant="headingLarge" style={{ color: '#FFFFFF' }}>{t('profile.myActivities')}</Text>
          <Text variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {activities.length} {t('profile.activities')}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </LinearGradient>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {activities.length === 0 ? (
          <Card style={styles.emptyCard} glass elevated>
            <Ionicons name="calendar-outline" size={64} color={theme.colors.textTertiary} />
            <Text variant="headingMedium" color="textSecondary" style={styles.emptyTitle}>
              {t('profile.noActivities')}
            </Text>
            <Text variant="body" color="textTertiary" style={styles.emptyDescription}>
              {t('profile.noActivitiesDescription')}
            </Text>
            <Button 
              variant="primary"
              onPress={() => router.push('/(tabs)/log')}
              style={styles.logFirstButton}
            >
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text variant="body" color="textInverse" style={styles.buttonText}>
                {t('activity.logNew')}
              </Text>
            </Button>
          </Card>
        ) : (
          <View style={styles.activitiesList}>
            {activities.map((activity) => {
              const typeColor = getActivityTypeColor(activity.type);
              const typeIcon = getActivityTypeIcon(activity.type);
              const typeLabel = getActivityTypeLabel(activity.type);
              
    return (
      <Card key={activity.id} style={styles.activityCard} glass elevated>
                  <View style={styles.activityHeader}>
                    <View style={[styles.activityTypeIcon, { backgroundColor: typeColor + '15' }]}>
                      <Ionicons name={typeIcon as any} size={24} color={typeColor} />
                    </View>
                    <View style={styles.activityHeaderContent}>
                      <Text variant="body" style={styles.activityTitle}>{activity.title}</Text>
                      <View style={[styles.typeBadge, { backgroundColor: typeColor + '20' }]}>
                        <Text variant="caption" style={{ color: typeColor, fontWeight: '600' }}>
                          {typeLabel}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  {activity.description && (
                    <Text variant="body" color="textSecondary" style={styles.activityDescription}>
                      {activity.description}
                    </Text>
                  )}
                  
                  <View style={styles.activityMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
                      <Text variant="caption" color="textSecondary">
                        {new Date(activity.date).toLocaleDateString()}
                      </Text>
                    </View>
                    
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
                      <Text variant="caption" color="textSecondary">
                        {formatDurationWithTranslation(activity.duration, t)}
                      </Text>
                    </View>
                    
                    {activity.location && (
                      <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
                        <Text variant="caption" color="textSecondary" numberOfLines={1}>
                          {activity.location}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.activityStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="heart-outline" size={16} color={theme.colors.textSecondary} />
                      <Text variant="caption" color="textSecondary">
                        {activity.reactions.length}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="chatbubble-outline" size={16} color={theme.colors.textSecondary} />
                      <Text variant="caption" color="textSecondary">
                        {activity.comments.length}
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 60, // Extra padding for status bar + spacing
      paddingBottom: theme.spacing.lg,
      paddingHorizontal: theme.spacing.md,
    },
    backButton: {
      padding: theme.spacing.sm,
      marginRight: theme.spacing.xs,
    },
    headerContent: {
      flex: 1,
      alignItems: 'center',
    },
    headerSpacer: {
      width: 40,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: theme.spacing.md,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xxl,
    },
    emptyText: {
      marginTop: theme.spacing.md,
      textAlign: 'center',
    },
    emptyCard: {
      padding: theme.spacing.xxl,
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    emptyTitle: {
      textAlign: 'center',
    },
    emptyDescription: {
      textAlign: 'center',
      paddingHorizontal: theme.spacing.lg,
    },
    logFirstButton: {
      marginTop: theme.spacing.md,
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    buttonText: {
      fontWeight: '600',
    },
    activitiesList: {
      gap: theme.spacing.md,
    },
    activityCard: {
      padding: theme.spacing.lg,
    },
    activityHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    activityTypeIcon: {
      width: 48,
      height: 48,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activityHeaderContent: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    activityTitle: {
      fontWeight: '600',
      fontSize: theme.typography.fontSize.lg,
    },
    typeBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
    },
    activityDescription: {
      marginBottom: theme.spacing.sm,
      lineHeight: 20,
    },
    activityMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
      paddingTop: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      marginBottom: theme.spacing.xs,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    activityStats: {
      flexDirection: 'row',
      gap: theme.spacing.lg,
      marginTop: theme.spacing.sm,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
  });
}

