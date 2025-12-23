/**
 * PRIVACY SETTINGS SCREEN
 * 
 * Allows users to control their privacy settings in compliance with GDPR.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Text } from '../components/ui/Text';
import { supabase } from '../config/supabase';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import { requestAccountDeletion, updatePrivacySettings } from '../services/supabase/authService';

type VisibilityOption = 'public' | 'unit' | 'private';

export default function PrivacySettingsScreen() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  // Privacy settings state
  const [profileVisibility, setProfileVisibility] = useState<VisibilityOption>('unit');
  const [activityVisibility, setActivityVisibility] = useState<VisibilityOption>('unit');
  const [showStatistics, setShowStatistics] = useState(true);
  const [showLocation, setShowLocation] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  
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
        .select('profile_visibility, activity_visibility, show_statistics, show_location, marketing_consent')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfileVisibility((data.profile_visibility as VisibilityOption) || 'unit');
        setActivityVisibility((data.activity_visibility as VisibilityOption) || 'unit');
        setShowStatistics(data.show_statistics ?? true);
        setShowLocation(data.show_location ?? false);
        setMarketingConsent(data.marketing_consent ?? false);
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
      Alert.alert(t('errors.generic'), t('privacy.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const savePrivacySettings = async () => {
    setSaving(true);
    try {
      await updatePrivacySettings({
        profileVisibility,
        activityVisibility,
        showStatistics,
        showLocation,
      });

      // Update marketing consent separately
      await supabase
        .from('profiles')
        .update({ marketing_consent: marketingConsent })
        .eq('id', user?.id);

      Alert.alert(t('common.success'), t('privacy.settingsSaved'));
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      Alert.alert(t('errors.generic'), t('privacy.saveError'));
    } finally {
      setSaving(false);
    }
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
              const fileUri = (FileSystem as any).documentDirectory + fileName;
              await (FileSystem as any).writeAsStringAsync(fileUri, JSON.stringify(userData, null, 2));

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

  const renderVisibilitySelector = (
    label: string,
    value: VisibilityOption,
    onChange: (value: VisibilityOption) => void
  ) => {
    const options: { value: VisibilityOption; label: string; icon: string }[] = [
      { value: 'public', label: t('privacy.public'), icon: 'earth' },
      { value: 'unit', label: t('privacy.unit'), icon: 'people' },
      { value: 'private', label: t('privacy.private'), icon: 'lock-closed' },
    ];

    return (
      <View style={styles.visibilitySelector}>
        <Text variant="body" style={{ marginBottom: theme.spacing.sm, fontWeight: '600' }}>
          {label}
        </Text>
        <View style={styles.visibilityOptions}>
          {options.map((option) => (
            <TouchableOpacity key={option.value} style={{ flex: 1 }} onPress={() => onChange(option.value)}>
              <Card
                glass
                style={[
                  styles.visibilityOption,
                  value === option.value && {
                    borderColor: theme.colors.primary,
                    borderWidth: 2,
                    backgroundColor: `${theme.colors.primary}15`,
                  },
                ]}
              >
                <Ionicons
                  name={option.icon as any}
                  size={24}
                  color={value === option.value ? theme.colors.primary : theme.colors.textSecondary}
                />
                <Text
                  variant="caption"
                  style={{
                    marginTop: theme.spacing.xs,
                    color: value === option.value ? theme.colors.primary : theme.colors.textSecondary,
                  }}
                >
                  {option.label}
                </Text>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.gradientStart} translucent={true} />
        <LinearGradient
          colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
          style={styles.header}
        >
          <Text variant="headingLarge" color="textInverse" style={styles.headerTitle}>
            {t('privacy.title')}
          </Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.gradientStart} translucent={true} />
      
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.header}
      >
        <Text variant="headingLarge" color="textInverse" style={styles.headerTitle}>
          {t('privacy.title')}
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Info Card */}
        <Card glass style={styles.section}>
          <Ionicons name="information-circle" size={24} color={theme.colors.info} />
          <Text variant="body" style={{ marginTop: theme.spacing.sm, color: theme.colors.textSecondary }}>
            {t('privacy.description')}
          </Text>
        </Card>

        {/* Visibility Settings */}
        <Card glass style={styles.section}>
          <Text variant="headingMedium" style={{ marginBottom: theme.spacing.md }}>
            {t('privacy.visibilitySettings')}
          </Text>

          {renderVisibilitySelector(
            t('privacy.profileVisibility'),
            profileVisibility,
            setProfileVisibility
          )}

          <View style={styles.divider} />

          {renderVisibilitySelector(
            t('privacy.activityVisibility'),
            activityVisibility,
            setActivityVisibility
          )}
        </Card>

        {/* Data Sharing Settings */}
        <Card glass style={styles.section}>
          <Text variant="headingMedium" style={{ marginBottom: theme.spacing.md }}>
            {t('privacy.dataSharingSettings')}
          </Text>

          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Ionicons name="stats-chart" size={20} color={theme.colors.textPrimary} />
              <View style={{ marginLeft: theme.spacing.sm, flex: 1 }}>
                <Text variant="body" style={{ fontWeight: '600' }}>{t('privacy.showStatistics')}</Text>
                <Text variant="caption" color="textSecondary">
                  {t('privacy.showStatisticsDescription')}
                </Text>
              </View>
            </View>
            <Switch
              value={showStatistics}
              onValueChange={setShowStatistics}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.surface}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Ionicons name="location" size={20} color={theme.colors.textPrimary} />
              <View style={{ marginLeft: theme.spacing.sm, flex: 1 }}>
                <Text variant="body" style={{ fontWeight: '600' }}>{t('privacy.showLocation')}</Text>
                <Text variant="caption" color="textSecondary">
                  {t('privacy.showLocationDescription')}
                </Text>
              </View>
            </View>
            <Switch
              value={showLocation}
              onValueChange={setShowLocation}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.surface}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Ionicons name="mail" size={20} color={theme.colors.textPrimary} />
              <View style={{ marginLeft: theme.spacing.sm, flex: 1 }}>
                <Text variant="body" style={{ fontWeight: '600' }}>{t('privacy.marketingConsent')}</Text>
                <Text variant="caption" color="textSecondary">
                  {t('privacy.marketingConsentDescription')}
                </Text>
              </View>
            </View>
            <Switch
              value={marketingConsent}
              onValueChange={setMarketingConsent}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.surface}
            />
          </View>
        </Card>

        {/* Save Button */}
        <Button
          variant="primary"
          onPress={savePrivacySettings}
          disabled={saving}
          style={{ marginTop: theme.spacing.md }}
        >
          {saving ? t('common.saving') : t('privacy.saveSettings')}
        </Button>

        {/* Data Rights (GDPR) */}
        <Card glass style={[styles.section, { marginTop: theme.spacing.lg }]}>
          <Text variant="headingMedium" style={{ marginBottom: theme.spacing.sm }}>
            {t('privacy.yourDataRights')}
          </Text>
          <Text variant="caption" color="textSecondary" style={{ marginBottom: theme.spacing.md }}>
            {t('privacy.dataRightsDescription')}
          </Text>

          <Button
            variant="outline"
            onPress={handleExportData}
            disabled={exporting}
            style={{ marginBottom: theme.spacing.sm }}
          >
            <Ionicons name="download-outline" size={16} color={theme.colors.primary} />
            <Text variant="body" color="primary" style={{ marginLeft: theme.spacing.xs }}>
              {exporting ? t('privacy.exporting') : t('privacy.downloadMyData')}
            </Text>
          </Button>

          <Button
            variant="outline"
            onPress={handleDeleteAccount}
            disabled={deleting}
            style={{
              borderColor: theme.colors.error,
            }}
          >
            <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
            <Text variant="body" style={{ marginLeft: theme.spacing.xs, color: theme.colors.error }}>
              {deleting ? t('privacy.deleting') : t('privacy.deleteAccount')}
            </Text>
          </Button>
        </Card>

        {/* Legal Info */}
        <Card glass style={[styles.section, { marginTop: theme.spacing.md }]}>
          <Text variant="caption" color="textSecondary" style={{ textAlign: 'center' }}>
            {t('privacy.gdprCompliant')}
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    textAlign: 'left',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    padding: 16,
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visibilitySelector: {
    marginBottom: 16,
  },
  visibilityOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  visibilityOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
});

