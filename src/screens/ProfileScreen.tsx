/**
 * PROFILE SCREEN
 * 
 * User profile with stats, badges preview, and edit functionality.
 */

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Keyboard, Modal, ScrollView, StatusBar, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, Card, Input, Text } from '../components/ui';
import { supabase } from '../config/supabase';
import { useActivities } from '../hooks/useActivities';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import { updateProfile } from '../services/supabase/authService';

export function ProfileScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const { activities } = useActivities('mine');
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [organization, setOrganization] = useState(user?.organization || '');
  const [rank, setRank] = useState(user?.rank || '');
  const [location, setLocation] = useState(user?.location || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user?.avatar);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Update form when user changes
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setDisplayName(user.displayName);
      setOrganization(user.organization || '');
      setRank(user.rank || '');
      setLocation(user.location || '');
      setBio(user.bio || '');
      setAvatarUrl(user.avatar);
    }
  }, [user]);
  
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
  
  const handleAvatarPick = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('common.permissionRequired'),
          t('profile.photoPermissionRequired')
        );
        return;
      }

      // Show options: camera or library
      Alert.alert(
        t('profile.selectAvatarSource'),
        '',
        [
          {
            text: t('profile.takePhoto'),
            onPress: async () => {
              const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
              if (cameraStatus.status !== 'granted') {
                Alert.alert(
                  t('common.permissionRequired'),
                  t('profile.cameraPermissionRequired')
                );
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              if (!result.canceled) {
                await uploadAvatar(result.assets[0].uri);
              }
            },
          },
          {
            text: t('profile.chooseFromLibrary'),
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              if (!result.canceled) {
                await uploadAvatar(result.assets[0].uri);
              }
            },
          },
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('errors.generic'), t('profile.avatarUploadError'));
    }
  };

  const uploadAvatar = async (imageUri: string) => {
    if (!user) return;

    setUploadingAvatar(true);
    try {
      // Convert image to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Create file name
      const fileExt = imageUri.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      await updateProfile({ avatar: publicUrl });
      setAvatarUrl(publicUrl);

      // Refresh user data
      await refreshUser();

      Alert.alert(t('common.success'), t('profile.avatarUpdateSuccess'));
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert(t('errors.generic'), t('profile.avatarUploadError'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await updateProfile({
        firstName,
        lastName,
        displayName,
        organization,
        rank,
        location,
        bio,
        avatar: avatarUrl,
      });
      
      // Refresh user data from Supabase
      await refreshUser();
      
      setEditModalVisible(false);
      Alert.alert(t('common.success'), t('profile.updateSuccess'));
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert(t('errors.generic'), t('profile.updateError'));
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordReset = () => {
    Alert.alert(
      t('profile.resetPassword'),
      t('profile.resetPasswordConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.resetPassword'),
          onPress: () => {
            Alert.alert(t('common.success'), t('profile.resetPasswordSent'));
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
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.gradientStart} translucent={true} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
                onPress={() => setEditModalVisible(true)}
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
      
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text variant="headingLarge">{t('profile.edit')}</Text>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Text variant="body" color="primary">{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.avatarSection}>
              <Avatar size={100} name={displayName} imageUrl={avatarUrl} />
              <Button 
                variant="ghost" 
                style={styles.avatarButton}
                onPress={handleAvatarPick}
                disabled={uploadingAvatar}
                loading={uploadingAvatar}
              >
                {uploadingAvatar ? t('common.uploading') : t('profile.editAvatar')}
              </Button>
            </View>
            
            <Input
              label={t('profile.firstName')}
              value={firstName}
              onChangeText={setFirstName}
              placeholder={t('profile.firstNamePlaceholder')}
            />
            
            <Input
              label={t('profile.lastName')}
              value={lastName}
              onChangeText={setLastName}
              placeholder={t('profile.lastNamePlaceholder')}
            />
            
            <Input
              label={t('profile.displayName')}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder={t('profile.displayNamePlaceholder')}
            />
            
            <Input
              label={t('profile.organization')}
              value={organization}
              onChangeText={setOrganization}
              placeholder={t('profile.organizationPlaceholder')}
            />
            
            <Input
              label={t('profile.rank')}
              value={rank}
              onChangeText={setRank}
              placeholder={t('profile.rankPlaceholder')}
            />
            
            <Input
              label={t('profile.location')}
              value={location}
              onChangeText={setLocation}
              placeholder={t('profile.locationPlaceholder')}
            />
            
            <Input
              label={t('profile.bio')}
              value={bio}
              onChangeText={setBio}
              placeholder={t('profile.bioPlaceholder')}
              multiline
              numberOfLines={4}
            />
            
            <Button variant="primary" onPress={handleSave} style={styles.saveButton} disabled={loading}>
              {loading ? t('common.saving') : t('common.save')}
            </Button>
            </ScrollView>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </Modal>
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
    },
    scrollContent: {
      paddingBottom: theme.spacing.huge,
    },
    headerBackground: {
      paddingTop: 60, // Extra padding for status bar + spacing
      paddingBottom: theme.spacing.xl,
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
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
      textAlign: 'center',
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
    modalContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    modalContent: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    avatarSection: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    avatarButton: {
      marginTop: theme.spacing.md,
    },
    saveButton: {
      marginTop: theme.spacing.xl,
    },
  });
}

