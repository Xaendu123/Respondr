/**
 * REGISTER SCREEN
 * 
 * Screen for new users to create an account.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Input, Text } from '../src/components/ui';
import { useTranslation } from '../src/hooks/useTranslation';
import { useAuth } from '../src/providers/AuthProvider';
import { useTheme } from '../src/providers/ThemeProvider';
import { hapticError, hapticLight, hapticSuccess } from '../src/utils/haptics';

export default function RegisterScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { register } = useAuth();
  const router = useRouter();
  
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailAlreadyRegistered, setEmailAlreadyRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
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
    if (emailAlreadyRegistered) {
      setEmailAlreadyRegistered(false);
        }
  };

  
  const handleRegister = async () => {
    // Clear previous errors
    setEmailError('');
    
    if (!displayName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
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
    
    if (password !== confirmPassword) {
      hapticError();
      Alert.alert(t('errors.validation'), t('auth.passwordsMustMatch'));
      return;
    }
    
    if (password.length < 6) {
      hapticError();
      Alert.alert(t('errors.validation'), t('auth.passwordTooShort'));
      return;
    }
    
    setIsRegistering(true);
    try {
      const confirmationEmail = await register({ 
        email: email.trim(), 
        password, 
        displayName: displayName.trim(),
      });
      hapticSuccess();
      
      // Only redirect to confirm email screen if signup was successful
      // (confirmationEmail will be null if user is already authenticated)
      if (confirmationEmail !== null) {
        router.push({
          pathname: '/confirm-email',
          params: { email: confirmationEmail || email.trim() },
        });
      }
      // If confirmationEmail is null, user is already authenticated
      // Navigation will happen automatically via auth state change
    } catch (error: any) {
      // Check if error is due to existing email
      const errorMessage = error.message || '';
      hapticError();
      if (
        errorMessage.includes('already registered') ||
        errorMessage.includes('already exists') ||
        errorMessage.includes('User already registered') ||
        error.code === 'signup_disabled' ||
        error.code === 'email_address_not_authorized'
      ) {
        setEmailAlreadyRegistered(true);
        setEmailError('');
      } else {
        setEmailError(errorMessage || t('auth.registrationFailed'));
        Alert.alert(t('errors.auth'), errorMessage || t('auth.registrationFailed'));
      }
    } finally {
      setIsRegistering(false);
    }
  };
  
  const handleBackToLogin = () => {
    hapticLight();
    router.back();
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
        <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        
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
            <Text style={styles.title}>{t('auth.createAccount')}</Text>
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
          
          {/* Registration Form */}
          <View style={styles.formCard}>
            <Input
              label={t('auth.displayName')}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder={t('auth.displayNamePlaceholder')}
              autoCapitalize="words"
            />
            
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
              {emailAlreadyRegistered && (
                <View style={styles.infoContainer}>
                  <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoText}>
                      {t('auth.emailAlreadyRegistered')}{' '}
                      <Text style={styles.infoLink} onPress={() => {
                        if (router.canGoBack()) {
                          router.back();
                        } else {
                          router.replace('/login');
                        }
                      }}>
                        {t('auth.signInHere')}
                      </Text>
                    </Text>
                  </View>
                </View>
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
                autoComplete="password-new"
                textContentType="newPassword"
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
            
            <Input
              label={t('auth.confirmPassword')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password-new"
              textContentType="newPassword"
            />
            
            <LinearGradient
              colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.registerButton}
            >
              <TouchableOpacity 
                onPress={handleRegister}
                disabled={isRegistering}
                style={styles.registerButtonInner}
              >
                {isRegistering ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.registerButtonText}>
                      {t('auth.signUp')}
                    </Text>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </LinearGradient>
          </View>
          
          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text variant="body" color="textSecondary">
              {t('auth.alreadyHaveAccount')}{' '}
            </Text>
            <TouchableOpacity onPress={handleBackToLogin}>
              <Text variant="body" color="primary" style={styles.loginLink}>
                {t('auth.signIn')}
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
    },
    backButton: {
      position: 'absolute',
      top: 50,
      left: theme.spacing.lg,
      zIndex: 10,
      padding: theme.spacing.sm,
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
      paddingVertical: 4,
    },
    tagline: {
      fontSize: 15,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.85)',
      letterSpacing: 0.3,
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
      paddingTop: theme.spacing.lg,
      minHeight: '100%',
    },
    formCard: {
      gap: theme.spacing.sm,
    },
    showPasswordButton: {
      position: 'absolute',
      right: theme.spacing.md,
      top: '50%',
      transform: [{ translateY: -10 }],
      padding: theme.spacing.sm,
    },
    registerButton: {
      marginTop: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      overflow: 'hidden',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    registerButtonInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
    },
    registerButtonText: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    loginContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    loginLink: {
      fontWeight: '600',
    },
    errorText: {
      color: theme.colors.error,
      marginTop: theme.spacing.xs,
      marginLeft: theme.spacing.xs,
    },
    infoContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.primary + '40',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginTop: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    infoContent: {
      flex: 1,
    },
    infoText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textPrimary,
      lineHeight: 20,
    },
    infoLink: {
      color: theme.colors.primary,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
  });
}

