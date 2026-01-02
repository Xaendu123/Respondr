/**
 * PROFILE SCREEN
 * 
 * User profile with stats, badges preview, and edit functionality.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedAvatar, AnimatedCounter, Button, Card, SwipeableCards, Text } from '../components/ui';
import { useActivities } from '../hooks/useActivities';
import { useBadges } from '../hooks/useBadges';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import { useToast } from '../providers/ToastProvider';
import { resetPassword } from '../services/supabase/authService';
import { formatDurationDetailed } from '../utils/formatDuration';

export function ProfileScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { activities, refresh } = useActivities('mine');
  const { earnedBadges, totalPoints, streak, refresh: refreshBadges } = useBadges();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  
  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        refresh();
        refreshBadges();
      }
    }, [refresh, refreshBadges, user])
  );
  
  // Calculate stats from activities
  const totalDurationInMinutes = activities.reduce((sum, a) => sum + a.duration, 0);
  
  // Calculate duration breakdown
  const totalMinutes = Math.floor(totalDurationInMinutes);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  
  const stats = {
    totalActivities: activities.length,
    totalDurationFormatted: formatDurationDetailed(totalDurationInMinutes, t),
    durationBreakdown: {
      days,
      hours,
      minutes,
    },
    activitiesByType: {
      training: activities.filter(a => a.type === 'training').length,
      exercise: activities.filter(a => a.type === 'exercise').length,
      operation: activities.filter(a => a.type === 'operation').length,
    },
    activitiesThisMonth: activities.filter(a => {
      const activityDate = new Date(a.date);
      const now = new Date();
      return activityDate.getMonth() === now.getMonth() && activityDate.getFullYear() === now.getFullYear();
    }).length,
    activitiesThisYear: activities.filter(a => {
      const activityDate = new Date(a.date);
      const now = new Date();
      return activityDate.getFullYear() === now.getFullYear();
    }).length,
  };
  
  // Get the highest earned badge as the current milestone
  const currentMilestone = earnedBadges.length > 0 ? earnedBadges[earnedBadges.length - 1] : null;

  // Translate badge name using translation key pattern
  const getBadgeName = (badgeName: string): string => {
    const translationKey = `badgeNames.${badgeName}`;
    const translated = t(translationKey);
    return translated === translationKey
      ? badgeName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : translated;
  };

  const styles = createStyles(theme);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refresh(), refreshBadges()]);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  const handlePasswordReset = async () => {
    if (!user?.email) {
      showToast({ type: 'error', message: t('errors.emailRequired') });
      return;
    }

    Alert.alert(
      t('profile.resetPassword'),
      t('profile.resetPasswordConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.resetPassword'),
          onPress: async () => {
            try {
              await resetPassword(user.email);
              showToast({ type: 'success', message: t('profile.resetPasswordSent') });
            } catch (error: any) {
              console.error('Password reset error:', error);
              showToast({ type: 'error', message: error?.message || t('auth.resetPasswordFailed') });
            }
          },
        },
      ]
    );
  };
  
  const handleLogout = () => {
    Alert.alert(
      t('settings.logout'),
      t('settings.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };
  
  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.emptyState}>
          <Ionicons name="person-circle-outline" size={80} color={theme.colors.textTertiary} />
          <Text variant="headingMedium" color="textSecondary" style={styles.emptyText}>
            {t('profile.notLoggedIn')}
          </Text>
          <Button
            variant="primary"
            onPress={() => router.push('/login')}
            style={styles.loginButton}
          >
            <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
            <Text variant="body" style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: theme.spacing.sm }}>
              {t('auth.login')}
            </Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.gradientStart} translucent={true} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: theme.spacing.huge + insets.bottom + 60 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Profile Header with Gradient */}
        <LinearGradient
          colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerBackground}
        >
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <AnimatedAvatar size={96} name={user.displayName} imageUrl={user.avatar} sharedTransitionTag="profile-avatar" />
            </View>
            <Text variant="headingLarge" style={[styles.name, { color: '#FFFFFF' }]}>{user.displayName}</Text>
            {user.bio && (
              <Text variant="body" style={[styles.bio, { color: 'rgba(255, 255, 255, 0.8)' }]}>
                {user.bio}
              </Text>
            )}
            <View style={styles.memberBadge}>
              <Ionicons name="calendar-outline" size={14} color="rgba(255, 255, 255, 0.7)" />
              <Text variant="caption" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {t('profile.memberSince')} {user.createdAt 
                  ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                  : new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                }
              </Text>
            </View>
            <View style={styles.buttonRow}>
              <Button
                variant="outline"
                onPress={() => router.push('/edit-profile')}
                style={styles.editButton}
              >
                <Ionicons name="create-outline" size={16} color="rgba(255, 255, 255, 0.7)" />
                <Text variant="caption" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {t('profile.edit')}
                </Text>
              </Button>
              <Button
                variant="outline"
                onPress={handleLogout}
                style={styles.logoutButton}
              >
                <Ionicons name="log-out-outline" size={16} color="rgba(255, 255, 255, 0.7)" />
                <Text variant="caption" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {t('auth.logout')}
                </Text>
              </Button>
            </View>
          </View>
        </LinearGradient>

        {/* Swipeable Stats & Badges Section - Above User Info */}
        <View style={styles.statsSection}>
          <SwipeableCards style={styles.swipeableContainer}>
            {/* Card 1: Statistics */}
            <Card style={styles.swipeableCard} glass>
              <ScrollView
                style={styles.cardScrollView}
                contentContainerStyle={styles.cardScrollContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                <View style={styles.swipeableCardHeader}>
                  <Ionicons name="stats-chart" size={20} color={theme.colors.primary} />
                  <Text variant="label" color="textSecondary" style={styles.swipeableCardTitle}>
                    {t('profile.statistics')}
                  </Text>
                </View>

                {/* Main Stats Row */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
                      <Ionicons name="list" size={24} color={theme.colors.primary} />
                    </View>
                    <AnimatedCounter
                      value={stats.totalActivities}
                      variant="headingLarge"
                      duration={1000}
                    />
                    <Text variant="caption" color="textSecondary">
                      {t('profile.totalActivities')}
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: theme.colors.success + '15' }]}>
                      <Ionicons name="time" size={24} color={theme.colors.success} />
                    </View>
                    <View style={styles.durationContainer}>
                      {stats.durationBreakdown.days > 0 && (
                        <View style={styles.durationItem}>
                          <AnimatedCounter
                            value={stats.durationBreakdown.days}
                            variant="headingMedium"
                            style={styles.durationValue}
                            duration={1200}
                          />
                          <Text variant="caption" color="textSecondary">{t('profile.days')}</Text>
                        </View>
                      )}
                      {stats.durationBreakdown.hours > 0 && (
                        <View style={styles.durationItem}>
                          <AnimatedCounter
                            value={stats.durationBreakdown.hours}
                            variant="headingMedium"
                            style={styles.durationValue}
                            duration={1200}
                          />
                          <Text variant="caption" color="textSecondary">{t('profile.hours')}</Text>
                        </View>
                      )}
                      <View style={styles.durationItem}>
                        <AnimatedCounter
                          value={stats.durationBreakdown.minutes}
                          variant="headingMedium"
                          style={styles.durationValue}
                          duration={1200}
                        />
                        <Text variant="caption" color="textSecondary">{t('profile.minutes')}</Text>
                      </View>
                    </View>
                    <Text variant="caption" color="textSecondary">
                      {t('profile.totalDuration')}
                    </Text>
                  </View>
                </View>

                {/* Activity Types */}
                <View style={styles.typesSection}>
                  <Text variant="caption" color="textSecondary" style={styles.typesSectionTitle}>
                    {t('profile.byType')}
                  </Text>
                  <View style={styles.typeStatsGrid}>
                    <View style={styles.typeStatCard}>
                      <View style={[styles.typeStatIconContainer, { backgroundColor: theme.colors.info + '15' }]}>
                        <Ionicons name="book" size={18} color={theme.colors.info} />
                      </View>
                      <AnimatedCounter
                        value={stats.activitiesByType.training}
                        variant="headingMedium"
                        style={{ color: theme.colors.info }}
                        duration={800}
                      />
                      <Text variant="caption" color="textSecondary" style={styles.typeStatLabel}>
                        {t('activity.typeTraining')}
                      </Text>
                    </View>

                    <View style={styles.typeStatCard}>
                      <View style={[styles.typeStatIconContainer, { backgroundColor: theme.colors.warning + '15' }]}>
                        <Ionicons name="fitness" size={18} color={theme.colors.warning} />
                      </View>
                      <AnimatedCounter
                        value={stats.activitiesByType.exercise}
                        variant="headingMedium"
                        style={{ color: theme.colors.warning }}
                        duration={800}
                      />
                      <Text variant="caption" color="textSecondary" style={styles.typeStatLabel}>
                        {t('activity.typeExercise')}
                      </Text>
                    </View>

                    <View style={styles.typeStatCard}>
                      <View style={[styles.typeStatIconContainer, { backgroundColor: theme.colors.error + '15' }]}>
                        <Ionicons name="flash" size={18} color={theme.colors.error} />
                      </View>
                      <AnimatedCounter
                        value={stats.activitiesByType.operation}
                        variant="headingMedium"
                        style={{ color: theme.colors.error }}
                        duration={800}
                      />
                      <Text variant="caption" color="textSecondary" style={styles.typeStatLabel}>
                        {t('activity.typeOperation')}
                      </Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            </Card>

            {/* Card 2: Badges & Achievements */}
            <Card style={styles.swipeableCard} glass>
              <ScrollView
                style={styles.cardScrollView}
                contentContainerStyle={styles.cardScrollContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                <View style={styles.swipeableCardHeader}>
                  <Ionicons name="ribbon" size={20} color={theme.colors.warning} />
                  <Text variant="label" color="textSecondary" style={styles.swipeableCardTitle}>
                    {t('badges.title')}
                  </Text>
                </View>

                {/* Current Badge */}
                <View style={styles.currentBadgeSection}>
                  <View style={styles.badgeEmojiContainer}>
                    <Text style={styles.badgeEmoji}>
                      {currentMilestone?.icon || '🎯'}
                    </Text>
                  </View>
                  <Text variant="headingMedium" style={styles.badgeName}>
                    {currentMilestone ? getBadgeName(currentMilestone.name) : t('milestones.first.title')}
                  </Text>
                  <Text variant="body" color="textSecondary" style={styles.badgeDescription}>
                    {currentMilestone?.description || t('milestones.first.message')}
                  </Text>
                </View>

                {/* Badge Stats */}
                <View style={styles.badgeStatsRow}>
                  <View style={styles.badgeStatItem}>
                    <AnimatedCounter
                      value={earnedBadges.length}
                      variant="headingLarge"
                      style={{ color: theme.colors.primary }}
                      duration={1000}
                    />
                    <Text variant="caption" color="textSecondary">
                      {t('badges.earned')}
                    </Text>
                  </View>

                  <View style={styles.badgeStatItem}>
                    <AnimatedCounter
                      value={totalPoints}
                      variant="headingLarge"
                      style={{ color: theme.colors.success }}
                      duration={1000}
                    />
                    <Text variant="caption" color="textSecondary">
                      {t('badges.progress')}
                    </Text>
                  </View>

                  {streak && streak.currentStreak > 0 && (
                    <View style={styles.badgeStatItem}>
                      <View style={styles.streakContainer}>
                        <Ionicons name="flame" size={20} color={theme.colors.warning} />
                        <AnimatedCounter
                          value={streak.currentStreak}
                          variant="headingLarge"
                          style={{ color: theme.colors.warning }}
                          duration={1000}
                        />
                      </View>
                      <Text variant="caption" color="textSecondary">
                        {t('profile.streak')}
                      </Text>
                    </View>
                  )}
                </View>

                {/* View All Badges Button */}
                <TouchableOpacity
                  style={styles.viewBadgesButton}
                  onPress={() => router.push('/badges')}
                >
                  <Text variant="body" style={{ color: theme.colors.primary }}>
                    {t('profile.viewAllBadges')}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
                </TouchableOpacity>
              </ScrollView>
            </Card>
          </SwipeableCards>
        </View>

        {/* Profile Information */}
        <Card style={styles.infoCard} glass>
          <Text variant="headingMedium" style={styles.sectionTitle}>
            {t('profile.information')}
          </Text>

          {(user.firstName || user.lastName) && (
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text variant="caption" color="textSecondary">{t('profile.name')}</Text>
                <Text variant="body">
                  {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.displayName}
                </Text>
              </View>
            </View>
          )}

          {user.organization && (
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={20} color={theme.colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text variant="caption" color="textSecondary">{t('profile.organization')}</Text>
                <Text variant="body">{user.organization}</Text>
              </View>
            </View>
          )}

          {user.rank && (
            <View style={styles.infoRow}>
              <Ionicons name="ribbon-outline" size={20} color={theme.colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text variant="caption" color="textSecondary">{t('profile.rank')}</Text>
                <Text variant="body">{user.rank}</Text>
              </View>
            </View>
          )}

          {user.location && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color={theme.colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text variant="caption" color="textSecondary">{t('profile.location')}</Text>
                <Text variant="body">{user.location}</Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text variant="caption" color="textSecondary">{t('profile.email')}</Text>
              <Text variant="body">{user.email}</Text>
            </View>
          </View>
        </Card>
        
        {/* Settings & Actions Section */}
        <View style={styles.settingsSection}>
          <Text variant="headingMedium" style={styles.settingsSectionTitle}>
            {t('settings.title')}
          </Text>
          <Card style={styles.actionsCard} glass>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/settings')}
          >
            <View style={styles.actionLeft}>
              <Ionicons name="settings-outline" size={24} color={theme.colors.textPrimary} />
              <Text variant="body">{t('settings.title')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handlePasswordReset}
          >
            <View style={styles.actionLeft}>
              <Ionicons name="key-outline" size={24} color={theme.colors.textPrimary} />
              <Text variant="body">{t('profile.resetPassword')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </Card>
        </View>
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
    scrollView: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    scrollContent: {
      paddingBottom: theme.spacing.huge,
      backgroundColor: 'transparent',
    },
    headerBackground: {
      paddingTop: 10060, // Extended padding (10000 + 60) to create infinite scroll effect
      paddingBottom: theme.spacing.xl,
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      backgroundColor: 'transparent',
      marginTop: -10000, // Large negative margin to extend gradient infinitely upward when scrolling
    },
    profileCard: {
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.xl,
      gap: theme.spacing.sm,
    },
    avatarContainer: {
      borderRadius: 100,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 12,
    },
    name: {
      marginTop: theme.spacing.md,
    },
    bio: {
      textAlign: 'center',
      marginTop: theme.spacing.xs,
    },
    memberBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xs,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    editButton: {
      flex: 1,
      flexDirection: 'row',
      gap: theme.spacing.xs,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      paddingVertical: theme.spacing.sm,
    },
    logoutButton: {
      flex: 1,
      flexDirection: 'row',
      gap: theme.spacing.xs,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      paddingVertical: theme.spacing.sm,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xxl,
    },
    emptyText: {
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.xl,
      textAlign: 'center',
    },
    loginButton: {
      marginTop: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
    },
    infoCard: {
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.lg,
    },
    sectionTitle: {
      marginBottom: theme.spacing.md,
    },
    statsSectionTitle: {
      marginBottom: theme.spacing.lg,
      paddingHorizontal: theme.spacing.xs,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    infoContent: {
      flex: 1,
    },
    statsSection: {
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
    },
    settingsSection: {
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    settingsSectionTitle: {
      marginBottom: theme.spacing.lg,
      paddingHorizontal: theme.spacing.xs,
    },
    // Swipeable cards styles
    swipeableContainer: {
      // Container fills parent width, cards match other cards in the screen
    },
    swipeableCard: {
      padding: theme.spacing.lg,
      height: 380,
    },
    cardScrollView: {
      flex: 1,
      marginHorizontal: -theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
    },
    cardScrollContent: {
      paddingBottom: theme.spacing.sm,
    },
    swipeableCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    swipeableCardTitle: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: theme.spacing.lg,
    },
    statItem: {
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    statIconContainer: {
      width: 48,
      height: 48,
      borderRadius: theme.borderRadius.xl,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.xs,
    },
    durationContainer: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      alignItems: 'center',
    },
    durationItem: {
      alignItems: 'center',
    },
    durationValue: {
      color: theme.colors.success,
    },
    typesSection: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: theme.spacing.md,
    },
    typesSectionTitle: {
      marginBottom: theme.spacing.md,
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.semibold,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    typeStatsGrid: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    typeStatCard: {
      flex: 1,
      alignItems: 'center',
      gap: theme.spacing.xxs,
    },
    typeStatIconContainer: {
      width: 36,
      height: 36,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    typeStatLabel: {
      textAlign: 'center',
      fontSize: theme.typography.fontSize.xs,
    },
    // Badge card styles
    currentBadgeSection: {
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    badgeEmojiContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.warning + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
    },
    badgeEmoji: {
      fontSize: 40,
      lineHeight: 48,
      textAlign: 'center',
    },
    badgeName: {
      textAlign: 'center',
      marginBottom: theme.spacing.xs,
    },
    badgeDescription: {
      textAlign: 'center',
      lineHeight: 20,
    },
    badgeStatsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      marginBottom: theme.spacing.md,
    },
    badgeStatItem: {
      alignItems: 'center',
      gap: theme.spacing.xxs,
    },
    streakContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xxs,
    },
    viewBadgesButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    actionsCard: {
      padding: 0,
    },
    actionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.lg,
    },
    actionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
    },
  });
}

