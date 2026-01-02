/**
 * FEED SCREEN
 * 
 * Social feed for sharing and interacting with activities - Coming Soon.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedAvatar, Card, Text } from '../components/ui';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';

export function FeedScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();

  const styles = createStyles(theme);
  
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
        <View style={styles.headerContent}>
          <Text variant="headingLarge" style={{ color: '#FFFFFF' }}>{t('feed.title')}</Text>
          <TouchableOpacity
            onPress={() => router.push('/profile')}
            style={styles.profileButton}
            activeOpacity={0.8}
          >
            <AnimatedAvatar
              size={36}
              name={user?.displayName || user?.firstName}
              imageUrl={user?.avatar}
              sharedTransitionTag="profile-avatar"
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {/* Coming Soon Content */}
      <View style={styles.content}>
        <Card style={styles.comingSoonCard} glass>
          <View style={styles.iconContainer}>
            <Ionicons name="sparkles-outline" size={80} color={theme.colors.primary} />
          </View>
          
          <Text variant="headingLarge" style={styles.title}>
            {t('feed.comingSoonTitle')}
          </Text>
          
          <Text variant="body" color="textSecondary" style={styles.description}>
            {t('feed.comingSoonDescription')}
          </Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="school-outline" size={24} color={theme.colors.primary} />
              <Text variant="body" style={styles.featureText}>
                {t('feed.featureKnowledge')}
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="people-outline" size={24} color={theme.colors.primary} />
              <Text variant="body" style={styles.featureText}>
                {t('feed.featureSocial')}
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="camera-outline" size={24} color={theme.colors.primary} />
              <Text variant="body" style={styles.featureText}>
                {t('feed.featureMedia')}
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="shield-checkmark-outline" size={24} color={theme.colors.primary} />
              <Text variant="body" style={styles.featureText}>
                {t('feed.featureSafety')}
              </Text>
            </View>
          </View>
        </Card>
      </View>
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
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    profileButton: {
      borderRadius: 18,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    comingSoonCard: {
      padding: theme.spacing.xxl,
      alignItems: 'center',
      maxWidth: 500,
      width: '100%',
    },
    iconContainer: {
      marginBottom: theme.spacing.xl,
    },
    title: {
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    description: {
      textAlign: 'center',
      marginBottom: theme.spacing.xxl,
      lineHeight: 24,
    },
    featuresList: {
      width: '100%',
      gap: theme.spacing.lg,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    featureText: {
      flex: 1,
    },
  });
}
