/**
 * NOT FOUND SCREEN
 * 
 * Custom screen shown when a route is not found or a deep link is invalid.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../src/components/ui';
import { useTranslationSafe } from '../src/hooks/useTranslation';
import { useThemeSafe } from '../src/providers/ThemeProvider';
import { hapticLight } from '../src/utils/haptics';

export default function NotFoundScreen() {
  const { theme } = useThemeSafe();
  const { t } = useTranslationSafe();
  const router = useRouter();
  
  const styles = createStyles(theme);
  
  const handleGoToLogin = () => {
    hapticLight();
    router.replace('/login');
  };
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Hero Section with Gradient */}
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroSection}
      >
        {/* Emergency Icons Background */}
        <View style={styles.iconsBackground}>
          <Ionicons name="flash" size={80} color="rgba(255, 255, 255, 0.08)" style={styles.icon1} />
          <Ionicons name="medical" size={70} color="rgba(255, 255, 255, 0.08)" style={styles.icon2} />
          <Ionicons name="flame" size={90} color="rgba(255, 255, 255, 0.08)" style={styles.icon3} />
        </View>
        
        {/* Main Content */}
        <View style={styles.heroContent}>
          <View style={styles.logoGroup}>
            <View style={styles.iconContainer}>
              <Ionicons name="alert-circle" size={64} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>{t('errors.routeNotFound') || 'Route Not Found'}</Text>
            <Text style={styles.subtitle}>
              {t('errors.routeNotFoundMessage') || 'The link you opened is invalid or has expired.'}
            </Text>
          </View>
        </View>
      </LinearGradient>
      
      {/* Content Section */}
      <View style={styles.contentSection}>
        <View style={styles.content}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={32} color={theme.colors.primary} />
            <Text variant="body" style={styles.infoText}>
              {t('errors.routeNotFoundHelp') || 'If you were trying to reset your password or confirm your email, please request a new link.'}
            </Text>
          </View>
          
          <LinearGradient
            colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <TouchableOpacity 
              onPress={handleGoToLogin}
              style={styles.buttonInner}
            >
              <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>
                {t('errors.goToLogin') || 'Go to Login'}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useThemeSafe>['theme']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    heroSection: {
      height: '50%',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      overflow: 'visible',
      paddingBottom: 40,
      paddingTop: 60,
    },
    iconsBackground: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    icon1: {
      position: 'absolute',
      top: 20,
      right: -10,
      transform: [{ rotate: '15deg' }],
    },
    icon2: {
      position: 'absolute',
      bottom: 20,
      left: -10,
      transform: [{ rotate: '-20deg' }],
    },
    icon3: {
      position: 'absolute',
      top: '45%',
      right: -20,
      transform: [{ rotate: '25deg' }],
    },
    heroContent: {
      alignItems: 'center',
      zIndex: 1,
      paddingVertical: theme.spacing.xl,
    },
    logoGroup: {
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: 32,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.5,
      lineHeight: 40,
      includeFontPadding: false,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 8,
      textAlign: 'center',
      paddingHorizontal: theme.spacing.xl,
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '500',
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
      paddingHorizontal: theme.spacing.xl,
      lineHeight: 24,
    },
    contentSection: {
      flex: 1,
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      marginTop: -32,
      zIndex: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
    },
    content: {
      flex: 1,
      padding: theme.spacing.xl,
      justifyContent: 'center',
      gap: theme.spacing.xl,
    },
    infoCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      gap: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    infoText: {
      flex: 1,
      color: theme.colors.textSecondary,
      lineHeight: 22,
    },
    button: {
      borderRadius: theme.borderRadius.full,
      overflow: 'hidden',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    buttonInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
    },
    buttonText: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
  });
}

