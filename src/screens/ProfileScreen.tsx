/**
 * PROFILE SCREEN
 * 
 * User profile with stats, badges preview, and edit functionality.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Button, Card, Text } from '../components/ui';
import { useActivities } from '../hooks/useActivities';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import { resetPassword } from '../services/supabase/authService';

export function ProfileScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { activities } = useActivities('mine');
  const insets = useSafeAreaInsets();
  
  // Calculate stats from activities
  const stats = {
    totalActivities: activities.length,
    totalHours: Math.round(activities.reduce((sum, a) => sum + a.duration, 0) / 60),
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
  
  const styles = createStyles(theme);
  
  const handlePasswordReset = async () => {
    if (!user?.email) {
      Alert.alert(t('errors.generic'), t('errors.emailRequired'));
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
            Alert.alert(t('common.success'), t('profile.resetPasswordSent'));
            } catch (error: any) {
              console.error('Password reset error:', error);
              Alert.alert(
                t('errors.generic'),
                error?.message || t('auth.resetPasswordFailed')
              );
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
              <Avatar size={96} name={user.displayName} imageUrl={user.avatar} />
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
        
        {/* Profile Information */}
        <Card style={styles.infoCard} glass elevated>
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
        
        {/* Stats Section */}
        <Card style={styles.statsCard} glass elevated>
          <Text variant="headingMedium" style={styles.sectionTitle}>
            {t('profile.statistics')}
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={styles.statHeader}>
                <Ionicons name="list-outline" size={24} color={theme.colors.primary} />
                <Text variant="headingLarge" style={styles.statValue}>
                  {stats.totalActivities}
                </Text>
              </View>
              <Text variant="caption" color="textSecondary">
                {t('profile.totalActivities')}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={styles.statHeader}>
                <Ionicons name="time-outline" size={24} color={theme.colors.success} />
                <Text variant="headingLarge" style={styles.statValue}>
                  {stats.totalHours}h
                </Text>
              </View>
              <Text variant="caption" color="textSecondary">
                {t('profile.totalDuration')}
              </Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <Text variant="label" color="textSecondary" style={styles.subsectionTitle}>
            {t('profile.byType')}
          </Text>
          
          <View style={styles.typeStats}>
            <View style={styles.typeStatRow}>
              <View style={styles.typeLabel}>
                <Ionicons name="book-outline" size={18} color={theme.colors.info} />
                <Text variant="body">{t('activity.typeTraining')}</Text>
              </View>
              <Text variant="headingSmall" style={{ color: theme.colors.info }}>
                {stats.activitiesByType.training}
              </Text>
            </View>
            
            <View style={styles.typeStatRow}>
              <View style={styles.typeLabel}>
                <Ionicons name="fitness-outline" size={18} color={theme.colors.warning} />
                <Text variant="body">{t('activity.typeExercise')}</Text>
              </View>
              <Text variant="headingSmall" style={{ color: theme.colors.warning }}>
                {stats.activitiesByType.exercise}
              </Text>
            </View>
            
            <View style={styles.typeStatRow}>
              <View style={styles.typeLabel}>
                <Ionicons name="flash-outline" size={18} color={theme.colors.error} />
                <Text variant="body">{t('activity.typeOperation')}</Text>
              </View>
              <Text variant="headingSmall" style={{ color: theme.colors.error }}>
                {stats.activitiesByType.operation}
              </Text>
            </View>
          </View>
        </Card>
        
        {/* Quick Actions */}
        <Card style={styles.actionsCard} glass elevated>
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
    statsCard: {
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.lg,
    },
    statsGrid: {
      flexDirection: 'row',
      gap: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    statItem: {
      flex: 1,
    },
    statHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.xs,
    },
    statValue: {
      flex: 1,
    },
    subsectionTitle: {
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    typeStats: {
      gap: theme.spacing.sm,
    },
    typeStatRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
    },
    typeLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    actionsCard: {
      marginHorizontal: theme.spacing.lg,
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

