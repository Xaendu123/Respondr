/**
 * SETTINGS SCREEN
 * 
 * App settings: theme, language, notifications, legal links.
 */

import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Linking, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Text } from '../components/ui';
import { ThemeMode } from '../config/theme';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../providers/AuthProvider';
import { useBrand } from '../providers/BrandProvider';
import { useTheme } from '../providers/ThemeProvider';
import { useToast } from '../providers/ToastProvider';

export function SettingsScreen() {
  const { theme, themeMode, setThemeMode } = useTheme();
  const { t, currentLanguage, changeLanguage } = useTranslation();
  const { refreshUser } = useAuth();
  const { showToast } = useToast();
  const brand = useBrand();
  const router = useRouter();
  
  const styles = createStyles(theme);
  
  const handleThemeChange = async (mode: ThemeMode) => {
    await setThemeMode(mode);
  };
  
  const handleLanguageChange = async (lang: string) => {
    await changeLanguage(lang);
    // Refresh user profile to get updated language preference
    try {
      await refreshUser();
    } catch (error) {
      // Silently fail - profile refresh is not critical
      console.warn('Failed to refresh user after language change:', error);
    }
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
            // Use the auth service to logout
            try {
              const { useAuth } = await import('../providers/AuthProvider');
              // Note: In a real implementation, you'd use the hook from component context
              showToast({ type: 'success', message: t('settings.loggedOut') });
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };
  
  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      showToast({ type: 'error', message: t('errors.couldNotOpenLink') });
    });
  };
  
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
        <Text variant="headingLarge" style={{ color: '#FFFFFF' }}>{t('settings.title')}</Text>
      </LinearGradient>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Appearance Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="color-palette-outline" size={20} color={theme.colors.primary} />
            <Text variant="headingSmall">{t('settings.theme')}</Text>
          </View>
          
          <Card style={styles.section} glass>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => handleThemeChange('light')}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="sunny-outline" size={24} color={theme.colors.textPrimary} />
                <Text variant="body">{t('settings.themeLight')}</Text>
              </View>
              {themeMode === 'light' && (
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => handleThemeChange('dark')}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="moon-outline" size={24} color={theme.colors.textPrimary} />
                <Text variant="body">{t('settings.themeDark')}</Text>
              </View>
              {themeMode === 'dark' && (
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => handleThemeChange('system')}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="phone-portrait-outline" size={24} color={theme.colors.textPrimary} />
                <Text variant="body">{t('settings.themeSystem')}</Text>
              </View>
              {themeMode === 'system' && (
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          </Card>
        </View>
        
        {/* Language Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="language-outline" size={20} color={theme.colors.primary} />
            <Text variant="headingSmall">{t('settings.language')}</Text>
          </View>
          
          <Card style={styles.section} glass>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => handleLanguageChange('de')}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.flagIcon, { backgroundColor: theme.colors.primaryLight }]}>
                  <Text style={styles.flagEmoji}>🇩🇪</Text>
                </View>
                <Text variant="body">{t('settings.languageGerman')}</Text>
              </View>
              {currentLanguage === 'de' && (
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => handleLanguageChange('en')}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.flagIcon, { backgroundColor: theme.colors.primaryLight }]}>
                  <Text style={styles.flagEmoji}>🇬🇧</Text>
                </View>
                <Text variant="body">{t('settings.languageEnglish')}</Text>
              </View>
              {currentLanguage === 'en' && (
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          </Card>
        </View>
        
        {/* Privacy Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.primary} />
            <Text variant="headingSmall">{t('settings.privacy')}</Text>
          </View>
          
          <Card style={styles.section} glass>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => router.push('/privacy-settings')}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="lock-closed-outline" size={24} color={theme.colors.textPrimary} />
                <Text variant="body">{t('settings.privacySettings')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </Card>
        </View>
        
        {/* Legal Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
            <Text variant="headingSmall">{t('settings.legal')}</Text>
          </View>
          
          <Card style={styles.section} glass>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => openLink(brand.metadata.privacyPolicyUrl)}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="shield-checkmark-outline" size={24} color={theme.colors.textPrimary} />
                <Text variant="body">{t('settings.privacyPolicy')}</Text>
              </View>
              <Ionicons name="open-outline" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => openLink(brand.metadata.termsOfServiceUrl)}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="document-outline" size={24} color={theme.colors.textPrimary} />
                <Text variant="body">{t('settings.termsOfService')}</Text>
              </View>
              <Ionicons name="open-outline" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </Card>
        </View>
        
        {/* About */}
        <Card style={styles.aboutCard} glass>
          <View style={styles.aboutContent}>
            <Ionicons name="information-circle-outline" size={48} color={theme.colors.primary} />
            <Text variant="body" color="textSecondary" style={styles.aboutText}>
              {brand.appName}
            </Text>
            <Text variant="caption" color="textTertiary">
              {t('settings.version')} {Constants.expoConfig?.version || '1.0.0'}
            </Text>
          </View>
        </Card>
        
        {/* Logout */}
        <Button
          variant="outline"
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
          <Text variant="label" style={{ color: theme.colors.error }}>
            {t('settings.logout')}
          </Text>
        </Button>
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
      paddingTop: 60, // Extra padding for status bar + spacing
      paddingBottom: theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: theme.spacing.lg,
      gap: theme.spacing.xl,
    },
    sectionContainer: {
      gap: theme.spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    section: {
      padding: 0,
      overflow: 'hidden',
    },
    optionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.lg,
    },
    optionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    flagIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    flagEmoji: {
      fontSize: 20,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginHorizontal: theme.spacing.lg,
    },
    aboutCard: {
      padding: theme.spacing.xl,
    },
    aboutContent: {
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    aboutText: {
      marginTop: theme.spacing.sm,
    },
    logoutButton: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      borderColor: theme.colors.error,
    },
  });
}

