/**
 * RESET PASSWORD SCREEN
 * 
 * Screen for resetting password via email link.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Input, Text } from '../src/components/ui';
import { supabase } from '../src/config/supabase';
import { useTranslation } from '../src/hooks/useTranslation';
import { useTheme } from '../src/providers/ThemeProvider';
import { hapticError, hapticSuccess } from '../src/utils/haptics';

export default function ResetPasswordScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ url?: string }>();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  const styles = createStyles(theme);
  
  // Extract and set session from URL if provided via deep link
  useEffect(() => {
    if (params.url) {
      // Extract tokens from URL hash (fragment)
      try {
        const urlObj = new URL(params.url);
        const hash = urlObj.hash.substring(1); // Remove the '#' prefix
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          // Set the session using tokens from URL hash
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          }).then(({ data, error }) => {
            if (error) {
              Alert.alert(
                t('errors.auth'),
                t('auth.invalidResetLink')
              );
            }
          });
        }
      } catch (error) {
        // Error parsing URL - silently handle
      }
    }
  }, [params.url, t]);
  
  const validatePassword = (pwd: string) => {
    if (pwd.length < 6) {
      return t('auth.passwordTooShort');
    }
    return '';
  };
  
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setPasswordError(validatePassword(text));
    
    // Also validate confirm password if it's been entered
    if (confirmPassword) {
      if (text !== confirmPassword) {
        setConfirmPasswordError(t('auth.passwordsMustMatch'));
      } else {
        setConfirmPasswordError('');
      }
    }
  };
  
  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (text !== password) {
      setConfirmPasswordError(t('auth.passwordsMustMatch'));
    } else {
      setConfirmPasswordError('');
    }
  };
  
  const handleResetPassword = async () => {
    // Validate
    if (!password.trim() || !confirmPassword.trim()) {
      hapticError();
      Alert.alert(t('errors.validation'), t('auth.fillAllFields'));
      return;
    }
    
    const pwdError = validatePassword(password);
    if (pwdError) {
      hapticError();
      setPasswordError(pwdError);
      Alert.alert(t('errors.validation'), pwdError);
      return;
    }
    
    if (password !== confirmPassword) {
      hapticError();
      setConfirmPasswordError(t('auth.passwordsMustMatch'));
      Alert.alert(t('errors.validation'), t('auth.passwordsMustMatch'));
      return;
    }
    
    setLoading(true);
    
    try {
      // Check if we have a valid session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData?.session) {
        // Try to extract tokens from URL if session is missing
        if (params.url) {
          try {
            const urlObj = new URL(params.url);
            const accessToken = urlObj.hash.match(/access_token=([^&]+)/)?.[1];
            const refreshToken = urlObj.hash.match(/refresh_token=([^&]+)/)?.[1];
            
            if (accessToken && refreshToken) {
              const { data: newSessionData, error: setSessionError } = await supabase.auth.setSession({
                access_token: decodeURIComponent(accessToken),
                refresh_token: decodeURIComponent(refreshToken),
              });
              
              if (setSessionError || !newSessionData?.session) {
                throw new Error(t('auth.invalidResetLink') || 'Invalid or expired reset link. Please request a new password reset.');
              }
            } else {
              throw new Error(t('auth.invalidResetLink') || 'Invalid or expired reset link. Please request a new password reset.');
            }
          } catch (urlError) {
            throw new Error(t('auth.invalidResetLink') || 'Invalid or expired reset link. Please request a new password reset.');
          }
        } else {
          throw new Error(t('auth.invalidResetLink') || 'Invalid or expired reset link. Please request a new password reset.');
        }
      }
      
      // Update password using Supabase
      // The session should now be set
      const { error } = await supabase.auth.updateUser({
        password: password.trim(),
      });
      
      if (error) {
        throw error;
      }
      
      hapticSuccess();
      
      // Clear loading state immediately
      setLoading(false);
      
      // Password reset successful - navigate immediately
      // Don't wait for Alert to be dismissed
      router.replace('/login');
      
      // Show success message after a short delay to allow navigation
      setTimeout(() => {
        Alert.alert(
          t('auth.passwordResetSuccess'),
          t('auth.passwordResetSuccessMessage'),
          [{ text: t('common.ok') }]
        );
      }, 300);
    } catch (error: any) {
      hapticError();
      console.error('Password reset error:', error);
      setLoading(false); // Clear loading on error
      Alert.alert(
        t('errors.auth'),
        error.message || t('auth.passwordResetFailed')
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
              {t('auth.resetPassword')}
            </Text>
            
            <View style={styles.formCard}>
              <View>
                <Input
                  label={t('auth.newPassword')}
                  value={password}
                  onChangeText={handlePasswordChange}
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
                {passwordError && (
                  <Text variant="caption" style={styles.errorText}>
                    {passwordError}
                  </Text>
                )}
              </View>
              
              <View>
                <Input
                  label={t('auth.confirmPassword')}
                  value={confirmPassword}
                  onChangeText={handleConfirmPasswordChange}
                  placeholder="••••••••"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                  textContentType="newPassword"
                />
                <TouchableOpacity 
                  style={styles.showPasswordButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons 
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
                    size={20} 
                    color={theme.colors.textSecondary} 
                  />
                </TouchableOpacity>
                {confirmPasswordError && (
                  <Text variant="caption" style={styles.errorText}>
                    {confirmPasswordError}
                  </Text>
                )}
              </View>
              
              <LinearGradient
                colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.resetButton}
              >
                <TouchableOpacity 
                  onPress={handleResetPassword}
                  disabled={loading}
                  style={styles.resetButtonInner}
                >
                  <Text style={styles.resetButtonText}>
                    {loading ? t('common.loading') : t('auth.resetPassword')}
                  </Text>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </LinearGradient>
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
    resetButton: {
      marginTop: theme.spacing.md,
      borderRadius: theme.borderRadius.full,
      overflow: 'hidden',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    resetButtonInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
    },
    resetButtonText: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    errorText: {
      color: theme.colors.error,
      marginTop: theme.spacing.xs,
      marginLeft: theme.spacing.xs,
    },
  });
}

