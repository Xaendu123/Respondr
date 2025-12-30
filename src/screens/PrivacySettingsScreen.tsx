/**
 * PRIVACY SETTINGS SCREEN
 * 
 * Allows users to control their privacy settings in compliance with GDPR.
 */

import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '../components/ui/Card';
import { Text } from '../components/ui/Text';
import { supabase } from '../config/supabase';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import { requestAccountDeletion, updatePrivacySettings } from '../services/supabase/authService';

type VisibilityOption = 'public' | 'unit' | 'private';

export default function PrivacySettingsScreen() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);

  // Privacy settings state
  const [profileVisibility, setProfileVisibility] = useState<VisibilityOption>('public');
  const [marketingConsent, setMarketingConsent] = useState(true);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load current privacy settings
  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('profile_visibility, marketing_consent')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfileVisibility((data.profile_visibility as VisibilityOption) || 'public');
        // Handle marketing_consent: if null/undefined, default to false (not true)
        // This ensures we respect explicit false values from the database
        setMarketingConsent(data.marketing_consent !== null && data.marketing_consent !== undefined ? data.marketing_consent : false);
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
      Alert.alert(t('errors.generic'), t('privacy.loadError'));
    } finally {
      setLoading(false);
    }
  };

  // Auto-save when settings change
  const savePrivacySettings = async (
    showSuccess = true,
    newProfileVisibility?: VisibilityOption,
    newMarketingConsent?: boolean
  ) => {
    if (!user) return;
    
    // Use new values if provided, otherwise use current state
    const visibilityToSave = newProfileVisibility !== undefined ? newProfileVisibility : profileVisibility;
    const marketingToSave = newMarketingConsent !== undefined ? newMarketingConsent : marketingConsent;
    
    setSaving(true);
    try {
      await updatePrivacySettings({
        profileVisibility: visibilityToSave,
        marketingConsent: marketingToSave,
      });

      // Update local state after successful save
      if (newProfileVisibility !== undefined) {
        setProfileVisibility(newProfileVisibility);
      }
      if (newMarketingConsent !== undefined) {
        setMarketingConsent(newMarketingConsent);
      }

      // Verify the save by reloading
      const { data: verifyData, error: verifyError } = await supabase
        .from('profiles')
        .select('profile_visibility, marketing_consent')
        .eq('id', user.id)
        .single();

      if (verifyError) {
        console.error('Error verifying save:', verifyError);
      } else {
        // Ensure UI matches database
        if (verifyData.profile_visibility !== visibilityToSave) {
          console.warn('Profile visibility mismatch! Expected:', visibilityToSave, 'Got:', verifyData.profile_visibility);
        }
        if (verifyData.marketing_consent !== marketingToSave) {
          console.warn('Marketing consent mismatch! Expected:', marketingToSave, 'Got:', verifyData.marketing_consent);
        }
      }

      if (showSuccess) {
      Alert.alert(t('common.success'), t('privacy.settingsSaved'));
      }
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      Alert.alert(t('errors.generic'), t('privacy.saveError'));
    } finally {
      setSaving(false);
    }
  };

  // Auto-save on visibility change
  const handleVisibilityChange = async (value: VisibilityOption) => {
    // Pass the new value directly to savePrivacySettings
    await savePrivacySettings(false, value, undefined);
  };

  // Auto-save on marketing consent change
  const handleMarketingConsentChange = async (value: boolean) => {
    // Pass the new value directly to savePrivacySettings
    await savePrivacySettings(false, undefined, value);
  };

  const handleExportData = async () => {
    if (!user) return;

    Alert.alert(
      t('privacy.exportDataTitle'),
      t('privacy.exportDataConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('privacy.export'),
          onPress: async () => {
            setExporting(true);
            try {
              // Fetch all user data
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

              const { data: activities } = await supabase
                .from('activities')
                .select('*')
                .eq('user_id', user.id);

              const { data: comments } = await supabase
                .from('comments')
                .select('*')
                .eq('user_id', user.id);

              const { data: reactions } = await supabase
                .from('reactions')
                .select('*')
                .eq('user_id', user.id);

              const { data: badges } = await supabase
                .from('user_badges')
                .select('*, badges(*)')
                .eq('user_id', user.id);

              const userData = {
                exportDate: new Date().toISOString(),
                profile,
                activities,
                comments,
                reactions,
                badges,
              };

              // Save to file
              const fileName = `respondr_data_${user.id}_${Date.now()}.json`;
              const fileUri = FileSystem.documentDirectory + fileName;
              await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(userData, null, 2));

              // Share file
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
              } else {
                Alert.alert(t('common.success'), t('privacy.exportSuccess'));
              }
            } catch (error) {
              console.error('Error exporting data:', error);
              Alert.alert(t('errors.generic'), t('privacy.exportError'));
            } finally {
              setExporting(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      t('privacy.deleteAccountTitle'),
      t('privacy.deleteAccountWarning'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('privacy.deleteAccount'),
          style: 'destructive',
          onPress: () => {
            // Second confirmation
            Alert.alert(
              t('privacy.confirmDeleteTitle'),
              t('privacy.confirmDeleteMessage'),
              [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('privacy.deleteAccount'),
                  style: 'destructive',
                  onPress: async () => {
                    setDeleting(true);
                    try {
                      await requestAccountDeletion(t('privacy.userRequestedDeletion'));
                      Alert.alert(
                        t('common.success'),
                        t('privacy.deleteRequestSubmitted'),
                        [
                          {
                            text: t('common.ok'),
                            onPress: () => {
                              logout();
                              router.replace('/login');
                            },
                          },
                        ]
                      );
                    } catch (error) {
                      console.error('Error requesting account deletion:', error);
                      Alert.alert(t('errors.generic'), t('privacy.deleteError'));
                    } finally {
                      setDeleting(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const getVisibilityInfo = (value: VisibilityOption) => {
    switch (value) {
      case 'public':
        return {
          icon: 'earth',
          color: theme.colors.success,
          description: t('privacy.publicDescription'),
        };
      case 'unit':
        return {
          icon: 'people',
          color: theme.colors.info,
          description: t('privacy.unitDescription'),
        };
      case 'private':
        return {
          icon: 'lock-closed',
          color: theme.colors.warning,
          description: t('privacy.privateDescription'),
        };
    }
  };

  if (loading) {
    return (
      <SafeAreaView edges={[]} style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.gradientStart} translucent={true} />
        <LinearGradient
          colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <Text variant="headingLarge" style={{ color: '#FFFFFF' }}>{t('privacy.title')}</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={[]} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.gradientStart} translucent={true} />
      
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text variant="headingLarge" style={{ color: '#FFFFFF' }}>{t('privacy.title')}</Text>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={[styles.contentContainer, { paddingBottom: theme.spacing.xxl + insets.bottom + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Visibility Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="eye-outline" size={20} color={theme.colors.primary} />
            <Text variant="headingSmall">{t('privacy.profileVisibility')}</Text>
          </View>
          
          <Card style={styles.section} glass>
            <View style={styles.visibilityInfo}>
              <View style={[styles.visibilityBadge, { backgroundColor: `${getVisibilityInfo(profileVisibility).color}15` }]}>
                <Ionicons 
                  name={getVisibilityInfo(profileVisibility).icon as any} 
                  size={24} 
                  color={getVisibilityInfo(profileVisibility).color} 
                />
              </View>
              <View style={styles.visibilityInfoText}>
                <Text variant="body" style={{ fontWeight: '600', marginBottom: theme.spacing.xs }}>
                  {profileVisibility === 'public' && t('privacy.public')}
                  {profileVisibility === 'unit' && t('privacy.unit')}
                  {profileVisibility === 'private' && t('privacy.private')}
          </Text>
                <Text variant="caption" color="textSecondary">
                  {getVisibilityInfo(profileVisibility).description}
                </Text>
              </View>
          </View>

          <View style={styles.divider} />

            <View style={styles.visibilityOptions}>
              {[
                { value: 'public' as VisibilityOption, label: t('privacy.public'), icon: 'earth', color: theme.colors.success },
                { value: 'unit' as VisibilityOption, label: t('privacy.unit'), icon: 'people', color: theme.colors.info },
                { value: 'private' as VisibilityOption, label: t('privacy.private'), icon: 'lock-closed', color: theme.colors.warning },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.visibilityOption}
                  onPress={() => handleVisibilityChange(option.value)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.visibilityOptionContent,
                      profileVisibility === option.value && {
                        borderColor: option.color,
                        borderWidth: 2,
                        backgroundColor: `${option.color}15`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={20}
                      color={profileVisibility === option.value ? option.color : theme.colors.textSecondary}
                    />
                    <Text
                      variant="caption"
                      style={{
                        marginTop: theme.spacing.xs,
                        color: profileVisibility === option.value ? option.color : theme.colors.textSecondary,
                        fontWeight: profileVisibility === option.value ? '600' : '400',
                      }}
                    >
                      {option.label}
                </Text>
                    {profileVisibility === option.value && (
                      <View style={[styles.checkBadge, { backgroundColor: option.color }]}>
                        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                      </View>
                    )}
              </View>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
          </View>

        {/* Marketing Consent Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="mail-outline" size={20} color={theme.colors.primary} />
            <Text variant="headingSmall">{t('privacy.dataSharingSettings')}</Text>
          </View>
          
          <Card style={styles.section} glass>
          <View style={styles.switchRow}>
              <View style={styles.switchContent}>
                <View style={[styles.switchIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                  <Ionicons name="mail" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.switchText}>
                  <Text variant="body" style={{ fontWeight: '600', marginBottom: theme.spacing.xs }}>
                    {t('privacy.marketingConsent')}
                  </Text>
                <Text variant="caption" color="textSecondary">
                  {t('privacy.marketingConsentDescription')}
                </Text>
              </View>
            </View>
            <Switch
              value={marketingConsent}
                onValueChange={handleMarketingConsentChange}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={marketingConsent ? '#FFFFFF' : theme.colors.surface}
                ios_backgroundColor={theme.colors.border}
            />
          </View>
        </Card>
        </View>

        {/* Save Status Indicator */}
        {saving && (
          <View style={styles.saveIndicator}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text variant="caption" color="textSecondary" style={{ marginLeft: theme.spacing.sm }}>
              {t('common.saving')}...
            </Text>
          </View>
        )}

        {/* Data Rights Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.primary} />
            <Text variant="headingSmall">{t('privacy.yourDataRights')}</Text>
          </View>
          
          <Card style={styles.section} glass>
            <View style={styles.dataRightsInfo}>
              <Ionicons name="information-circle-outline" size={20} color={theme.colors.info} />
              <Text variant="caption" color="textSecondary" style={{ flex: 1, marginLeft: theme.spacing.sm }}>
            {t('privacy.dataRightsDescription')}
          </Text>
            </View>
            
            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionButton}
            onPress={handleExportData}
            disabled={exporting}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                <Ionicons name="download-outline" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.actionContent}>
                <Text variant="body" style={{ fontWeight: '600' }}>
              {exporting ? t('privacy.exporting') : t('privacy.downloadMyData')}
            </Text>
                <Text variant="caption" color="textSecondary">
                  {t('privacy.exportDescription')}
                </Text>
              </View>
              {exporting ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
              )}
            </TouchableOpacity>
          </Card>
        </View>

        {/* Delete Account Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="warning-outline" size={20} color={theme.colors.error} />
            <Text variant="headingSmall" style={{ color: theme.colors.error }}>
              {t('privacy.dangerZone')}
            </Text>
          </View>
          
          <Card style={[styles.section, styles.dangerCard]} glass>
            <View style={styles.dangerContent}>
              <View style={[styles.dangerIcon, { backgroundColor: `${theme.colors.error}15` }]}>
                <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
              </View>
              <View style={styles.dangerText}>
                <Text variant="body" style={{ fontWeight: '600', marginBottom: theme.spacing.xs }}>
                  {t('privacy.deleteAccount')}
                </Text>
                <Text variant="caption" color="textSecondary">
                  {t('privacy.deleteAccountDescription')}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
            onPress={handleDeleteAccount}
            disabled={deleting}
              activeOpacity={0.7}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                  <Text variant="body" style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: theme.spacing.xs }}>
                    {t('privacy.deleteAccount')}
            </Text>
                </>
              )}
            </TouchableOpacity>
        </Card>
        </View>

        {/* GDPR Compliance Footer */}
        <View style={styles.footer}>
          <Ionicons name="shield-checkmark" size={16} color={theme.colors.textTertiary} />
          <Text variant="caption" color="textTertiary" style={{ marginLeft: theme.spacing.xs }}>
            {t('privacy.gdprCompliant')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
      paddingTop: 60, // Extra padding for status bar + spacing
      paddingBottom: theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
    },
    sectionContainer: {
      marginBottom: theme.spacing.xl,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.xs,
  },
  section: {
      padding: theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
    visibilityInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: theme.borderRadius.md,
    },
    visibilityBadge: {
      width: 48,
      height: 48,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    visibilityInfoText: {
      flex: 1,
  },
  visibilityOptions: {
    flexDirection: 'row',
      gap: theme.spacing.sm,
  },
  visibilityOption: {
    flex: 1,
    },
    visibilityOptionContent: {
    alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
    borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      position: 'relative',
      minHeight: 80,
    },
    checkBadge: {
      position: 'absolute',
      top: theme.spacing.xs,
      right: theme.spacing.xs,
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
  },
  divider: {
    height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: theme.spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
    switchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
      marginRight: theme.spacing.md,
    },
    switchIcon: {
      width: 40,
      height: 40,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    switchText: {
      flex: 1,
    },
    saveIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    dataRightsInfo: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.md,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
    },
    actionIcon: {
      width: 40,
      height: 40,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    actionContent: {
      flex: 1,
    },
    dangerCard: {
      borderWidth: 1,
      borderColor: `${theme.colors.error}30`,
    },
    dangerContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.md,
    },
    dangerIcon: {
      width: 48,
      height: 48,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    dangerText: {
      flex: 1,
    },
    deleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.error,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginTop: theme.spacing.sm,
    },
    deleteButtonDisabled: {
      opacity: 0.6,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.lg,
      marginTop: theme.spacing.md,
  },
});
}

