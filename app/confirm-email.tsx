/**
 * CONFIRM EMAIL SCREEN
 * 
 * Screen shown after signup to prompt user to confirm their email.
 * Allows resending confirmation emails.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text } from '../src/components/ui';
import { useTranslation } from '../src/hooks/useTranslation';
import { useTheme } from '../src/providers/ThemeProvider';
import { resendConfirmationEmail } from '../src/services/supabase/authService';
import { hapticError, hapticLight, hapticSuccess } from '../src/utils/haptics';

export default function ConfirmEmailScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email || '';
  
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [hasAutoSent, setHasAutoSent] = useState(false);
  
  const styles = createStyles(theme);
  
  // Automatically send confirmation email when screen opens
  React.useEffect(() => {
    if (email && !hasAutoSent) {
      const sendInitialEmail = async () => {
        try {
          setIsResending(true);
          await resendConfirmationEmail(email);
          setHasAutoSent(true);
          // Start 60 second cooldown
          setResendCooldown(60);
          hapticSuccess();
        } catch (error: any) {
          // Handle rate limiting gracefully
          if (error.code === 'RATE_LIMIT') {
            // Set cooldown from error message
            const cooldown = error.cooldownSeconds || 60;
            setResendCooldown(cooldown);
            setHasAutoSent(true); // Mark as sent to prevent retry
            // Don't show error - just set cooldown
          } else {
            // Silently fail on other errors - user can manually resend if needed
            console.error('Auto-send confirmation email failed:', error);
          }
        } finally {
          setIsResending(false);
        }
      };
      
      sendInitialEmail();
    }
  }, [email, hasAutoSent]);
  
  // Countdown timer effect
  React.useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);
  
  const handleResendEmail = async () => {
    if (!email) {
      hapticError();
      Alert.alert(t('errors.error'), t('auth.emailRequired'));
      return;
    }
    
    if (resendCooldown > 0) {
      return; // Prevent resending during cooldown
    }
    
    try {
      setIsResending(true);
      hapticLight();
      await resendConfirmationEmail(email);
      hapticSuccess();
      
      // Start 60 second cooldown
      setResendCooldown(60);
      
      Alert.alert(
        t('common.success'),
        t('auth.confirmationEmailSent'),
        [{ text: t('common.ok') }]
      );
    } catch (error: any) {
      // Handle rate limiting gracefully
      if (error.code === 'RATE_LIMIT') {
        // Set cooldown from error message
        const cooldown = error.cooldownSeconds || 60;
        setResendCooldown(cooldown);
        // Show friendly message instead of error
        Alert.alert(
          t('common.info'),
          t('auth.resendConfirmationCooldown', { seconds: cooldown }),
          [{ text: t('common.ok') }]
        );
      } else {
      hapticError();
      const errorMessage = error.message || t('auth.resendConfirmationFailed');
      Alert.alert(t('errors.error'), errorMessage);
      }
    } finally {
      setIsResending(false);
    }
  };
  
  const handleBackToLogin = () => {
    hapticLight();
    // Use back navigation to get the proper back animation
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/login');
    }
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
        
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        
        {/* Main Logo and Title */}
        <View style={styles.heroContent}>
          <View style={styles.logoGroup}>
            <View style={styles.logoIconsRow}>
              <View style={styles.miniIconContainer}>
                <Ionicons name="flame" size={28} color="#FFFFFF" />
              </View>
              <View style={[styles.miniIconContainer, styles.miniIconCenter]}>
                <Ionicons name="mail-outline" size={32} color="#FFFFFF" />
              </View>
              <View style={styles.miniIconContainer}>
                <Ionicons name="medical" size={28} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.heroTitle}>{t('auth.confirmEmailTitle')}</Text>
            <Text style={styles.tagline}>{t('auth.confirmEmailSubtitle')}</Text>
          </View>
        </View>
      </LinearGradient>
      
      {/* Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Email Display */}
            {email && (
              <View style={styles.emailContainer}>
                <Ionicons name="mail" size={24} color={theme.colors.primary} />
                <Text style={styles.emailText}>{email}</Text>
              </View>
            )}
            
            {/* Instructions */}
            <Text style={styles.instructionText}>
              {t('auth.confirmEmailInstructions')}
            </Text>
            
            {/* Resend Button */}
            <Button
              onPress={handleResendEmail}
              disabled={isResending || !email || resendCooldown > 0}
              loading={isResending}
              style={styles.resendButton}
            >
              {resendCooldown > 0 
                ? t('auth.resendConfirmationCooldown', { seconds: resendCooldown })
                : t('auth.resendConfirmation')
              }
            </Button>
            
            {/* Help Text */}
            <Text style={styles.helpText}>
              {t('auth.confirmEmailHelp')}
            </Text>
            
            {/* Back to Login */}
            <TouchableOpacity
              style={styles.backToLoginButton}
              onPress={handleBackToLogin}
            >
              <Text style={styles.backToLoginText}>
                {t('auth.backToLogin')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  heroSection: {
    height: '45%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
    paddingBottom: 40,
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
  backButton: {
    position: 'absolute',
    top: 50,
    left: theme.spacing.lg,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
    zIndex: 1,
    paddingVertical: theme.spacing.xl,
  },
  logoGroup: {
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
  },
  logoIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  miniIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  miniIconCenter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 40,
    includeFontPadding: false,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    paddingVertical: 4,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emailText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginLeft: 12,
    fontWeight: '500',
  },
  instructionText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  resendButton: {
    marginBottom: 24,
  },
  helpText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  backToLoginButton: {
    padding: 16,
    alignItems: 'center',
  },
  backToLoginText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

