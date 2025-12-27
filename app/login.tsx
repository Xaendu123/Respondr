/**
 * LOGIN SCREEN
 * 
 * Entry point for users to authenticate.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Input, Text } from '../src/components/ui';
import { useTranslation } from '../src/hooks/useTranslation';
import { useAuth } from '../src/providers/AuthProvider';
import { useTheme } from '../src/providers/ThemeProvider';
import { hapticError, hapticLight, hapticSuccess } from '../src/utils/haptics';

export default function LoginScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { login, isLoading } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  
  const styles = createStyles(theme);
  
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const handleEmailChange = (text: string) => {
    setEmail(text);
    // Clear error when user starts typing (only show error on submit)
    if (emailError) {
      setEmailError('');
    }
  };
  
  const handleLogin = async () => {
    // Clear previous errors
    setEmailError('');
    
    if (!email.trim() || !password.trim()) {
      hapticError();
      Alert.alert(t('errors.validation'), t('auth.fillAllFields'));
      return;
    }
    
    // Validate email only on submit
    if (!validateEmail(email.trim())) {
      hapticError();
      setEmailError(t('auth.invalidEmail'));
      Alert.alert(t('errors.validation'), t('auth.invalidEmail'));
      return;
    }
    
    try {
      await login(email.trim(), password);
      hapticSuccess();
      // Navigation will happen automatically via auth state change
    } catch (error: any) {
      hapticError();
      
      // Check if error is due to email not being confirmed
      if (error.code === 'EMAIL_NOT_CONFIRMED' || error.message?.includes('Email not confirmed')) {
        // Navigate to confirm-email screen with the email
        router.replace({
          pathname: '/confirm-email',
          params: { email: error.email || email.trim() },
        });
        return;
      }
      
      Alert.alert(t('errors.auth'), error.message || t('auth.loginFailed'));
    }
  };
  
  const handleRegister = () => {
    hapticLight();
    router.push('/register');
  };
  
  const handleForgotPassword = async () => {
    hapticLight();
    
    // Validate email first
    if (!email.trim()) {
      Alert.alert(
        t('auth.forgotPassword'),
        t('auth.enterEmailForReset'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.ok'),
            onPress: () => {
              // Focus email input (would need ref for this, but simple alert is fine)
            },
          },
        ]
      );
      return;
    }
    
    if (!validateEmail(email.trim())) {
      hapticError();
      Alert.alert(t('errors.validation'), t('auth.invalidEmail'));
      return;
    }
    
    try {
      const { resetPassword } = await import('../src/services/supabase/authService');
      await resetPassword(email.trim());
      hapticSuccess();
      Alert.alert(
        t('auth.passwordResetSent'),
        t('auth.checkEmailForReset'),
        [{ text: t('common.ok') }]
      );
    } catch (error: any) {
      hapticError();
      Alert.alert(
        t('errors.auth'),
        error.message || t('auth.resetPasswordFailed')
      );
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
        {/* Back Button */}
        {router.canGoBack() && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              hapticLight();
              router.back();
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        
        {/* Emergency Icons Background */}
        <View style={styles.iconsBackground}>
          <Ionicons name="flash" size={80} color="rgba(255, 255, 255, 0.08)" style={styles.icon1} />
          <Ionicons name="medical" size={70} color="rgba(255, 255, 255, 0.08)" style={styles.icon2} />
          <Ionicons name="flame" size={90} color="rgba(255, 255, 255, 0.08)" style={styles.icon3} />
        </View>
        
        {/* Main Logo and Title */}
        <View style={styles.heroContent}>
          <View style={styles.logoGroup}>
            <View style={styles.logoIconsRow}>
              <View style={styles.miniIconContainer}>
                <Ionicons name="flame" size={28} color="#FFFFFF" />
              </View>
              <View style={[styles.miniIconContainer, styles.miniIconCenter]}>
                <Ionicons name="flash" size={32} color="#FFFFFF" />
              </View>
              <View style={styles.miniIconContainer}>
                <Ionicons name="medical" size={28} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.appName}>Respondr</Text>
            <Text style={styles.tagline}>{t('auth.tagline')}</Text>
          </View>
        </View>
      </LinearGradient>
      
      {/* Form Section */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={styles.formSection}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.formContent}>
            <Text variant="headingMedium" style={styles.welcomeText}>
              {t('auth.welcomeBack')}
            </Text>
            
            {/* Login Form */}
            <View style={styles.formCard}>
            <View>
              <Input
                label={t('auth.email')}
                value={email}
                onChangeText={handleEmailChange}
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="username"
              />
              {emailError && (
                <Text variant="caption" style={styles.errorText}>
                  {emailError}
                </Text>
              )}
            </View>
            
            <View>
              <Input
                label={t('auth.password')}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                textContentType="password"
              />
              <TouchableOpacity 
                style={styles.showPasswordButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                  size={20} 
                  color={theme.colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
            >
              <Text variant="caption" color="primary">
                {t('auth.forgotPassword')}
              </Text>
            </TouchableOpacity>
            
            <LinearGradient
              colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginButton}
            >
              <TouchableOpacity 
                onPress={handleLogin}
                disabled={isLoading}
                style={styles.loginButtonInner}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? t('common.loading') : t('auth.signIn')}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>
          </View>
          
          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text variant="body" color="textSecondary">
              {t('auth.noAccount')}{' '}
            </Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text variant="body" color="primary" style={styles.registerLink}>
                {t('auth.signUp')}
              </Text>
            </TouchableOpacity>
          </View>
          </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
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
      paddingTop: Platform.OS === 'ios' ? 50 : 20,
    },
    backButton: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 50 : 20,
      left: theme.spacing.lg,
      zIndex: 10,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
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
    appName: {
      fontSize: 42,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -1,
      lineHeight: 52,
      includeFontPadding: false,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 8,
      paddingVertical: 4,
    },
    tagline: {
      fontSize: 16,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.9)',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    formSection: {
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
    scrollContent: {
      flexGrow: 1,
    },
    formContent: {
      flex: 1,
      padding: theme.spacing.xl,
      paddingTop: theme.spacing.xl,
      minHeight: '100%',
    },
    welcomeText: {
      marginBottom: theme.spacing.lg,
      textAlign: 'center',
    },
    formCard: {
      gap: theme.spacing.md,
    },
    showPasswordButton: {
      position: 'absolute',
      right: theme.spacing.md,
      top: '50%',
      transform: [{ translateY: -10 }],
      padding: theme.spacing.sm,
    },
    forgotPassword: {
      alignSelf: 'flex-end',
    },
    loginButton: {
      marginTop: theme.spacing.md,
      borderRadius: theme.borderRadius.full,
      overflow: 'hidden',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    loginButtonInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
    },
    loginButtonText: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    registerContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: theme.spacing.md,
    },
    registerLink: {
      fontWeight: '600',
    },
    errorText: {
      color: theme.colors.error,
      marginTop: theme.spacing.xs,
      marginLeft: theme.spacing.xs,
    },
  });
}

