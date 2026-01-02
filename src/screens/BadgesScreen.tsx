/**
 * BADGES SCREEN
 * 
 * View all earned and locked badges with progress tracking.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text } from '../components/ui';
import { useBadges } from '../hooks/useBadges';
import { useTranslation } from '../hooks/useTranslation';
import { useTheme } from '../providers/ThemeProvider';
import { BadgeLevel } from '../types';

export function BadgesScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { earnedBadges, lockedBadges, allBadges, loading, error, refresh } = useBadges();

  // Translate badge name using translation key pattern
  const getBadgeName = (badgeName: string): string => {
    const translationKey = `badgeNames.${badgeName}`;
    const translated = t(translationKey);
    // If no translation found, return the raw name formatted nicely
    return translated === translationKey
      ? badgeName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : translated;
  };
  
  const styles = createStyles(theme);
  
  const getLevelColor = (level: BadgeLevel): string => {
    switch (level) {
      case 'bronze':
        return '#CD7F32';
      case 'silver':
        return '#C0C0C0';
      case 'gold':
        return '#FFD700';
      default:
        return theme.colors.textSecondary;
    }
  };
  
  const getLevelIcon = (level: BadgeLevel): string => {
    switch (level) {
      case 'bronze':
        return 'medal';
      case 'silver':
        return 'medal';
      case 'gold':
        return 'trophy';
      default:
        return 'star';
    }
  };
  
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text variant="headingLarge">{t('badges.title')}</Text>
          <Text variant="caption" color="textSecondary">
            {earnedBadges.length} {t('badges.of')} {allBadges.length} {t('badges.earned')}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading && allBadges.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
          <Text variant="body" color="error" style={{ marginTop: theme.spacing.md }}>
            {error}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {renderHeader()}
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      >
        {/* Earned Section */}
        {earnedBadges.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text variant="headingMedium">{t('badges.earned')}</Text>
            </View>
            
            <View style={styles.badgesGrid}>
              {earnedBadges.map((badge) => {
                const levelColor = getLevelColor(badge.level);
                
                return (
                  <Card
                    key={badge.id}
                    style={styles.badgeCard}
                    glass
                  >
                    <View
                      style={[
                        styles.badgeIconContainer,
                        { backgroundColor: levelColor },
                      ]}
                    >
                      <Ionicons
                        name={getLevelIcon(badge.level) as any}
                        size={36}
                        color="#FFFFFF"
                      />
                    </View>
                    
                    <Text variant="label" style={styles.badgeName} numberOfLines={2}>
                      {getBadgeName(badge.name)}
                    </Text>
                    
                    <View
                      style={[
                        styles.levelBadge,
                        { backgroundColor: levelColor + '20' },
                      ]}
                    >
                      <Text variant="caption" style={{ color: levelColor, fontWeight: '600' }}>
                        {badge.level.toUpperCase()}
                      </Text>
                    </View>
                  </Card>
                );
              })}
            </View>
          </>
        )}
        
        {/* Locked Section */}
        {lockedBadges.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="lock-closed" size={20} color={theme.colors.textSecondary} />
              <Text variant="headingMedium">{t('badges.locked')}</Text>
            </View>
            
            <View style={styles.badgesGrid}>
              {lockedBadges.map((badge) => {
                return (
                  <Card
                    key={badge.id}
                    style={[styles.badgeCard, styles.badgeCardLocked]}
                    glass
                  >
                    <View
                      style={[
                        styles.badgeIconContainer,
                        { backgroundColor: theme.colors.disabledBackground },
                      ]}
                    >
                      <Ionicons
                        name="lock-closed"
                        size={28}
                        color={theme.colors.disabled}
                      />
                    </View>
                    
                    <Text variant="label" style={styles.badgeName} numberOfLines={2} color="textSecondary">
                      {getBadgeName(badge.name)}
                    </Text>
                    
                    {badge.progress !== undefined && (
                      <>
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${badge.progress}%`,
                                backgroundColor: theme.colors.primary,
                              },
                            ]}
                          />
                        </View>
                        <Text variant="caption" color="textTertiary">
                          {badge.progress}%
                        </Text>
                      </>
                    )}
                  </Card>
                );
              })}
            </View>
          </>
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
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    backButton: {
      padding: theme.spacing.xs,
    },
    headerTitles: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: theme.spacing.lg,
      gap: theme.spacing.xl,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    badgesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
    },
    badgeCard: {
      width: '47%',
      padding: theme.spacing.lg,
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    badgeCardLocked: {
      opacity: 0.6,
    },
    badgeIconContainer: {
      width: 72,
      height: 72,
      borderRadius: 36,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    badgeName: {
      textAlign: 'center',
      minHeight: 34,
    },
    levelBadge: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xxs,
      borderRadius: theme.borderRadius.full,
    },
    progressBar: {
      width: '100%',
      height: 4,
      backgroundColor: theme.colors.divider,
      borderRadius: theme.borderRadius.sm,
      marginTop: theme.spacing.sm,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: theme.borderRadius.sm,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
  });
}

