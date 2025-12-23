/**
 * CONSENT DIALOG COMPONENT
 * 
 * GDPR-compliant consent dialog shown on first app launch.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { useTranslation } from 'react-i18next';
import { useTheme } from '../providers/ThemeProvider';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Text } from './ui/Text';

interface ConsentDialogProps {
  visible: boolean;
  onAccept: (consents: ConsentOptions) => void;
  onDecline: () => void;
}

export interface ConsentOptions {
  dataProcessing: boolean;
  marketing: boolean;
}

export function ConsentDialog({ visible, onAccept, onDecline }: ConsentDialogProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [dataProcessingConsent, setDataProcessingConsent] = useState(true); // Required
  const [marketingConsent, setMarketingConsent] = useState(false); // Optional

  const handleAccept = () => {
    onAccept({
      dataProcessing: dataProcessingConsent,
      marketing: marketingConsent,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          {/* Header */}
          <LinearGradient
            colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
            style={styles.header}
          >
            <Ionicons name="shield-checkmark" size={48} color="#FFFFFF" />
            <Text variant="headingLarge" color="textInverse" style={{ marginTop: theme.spacing.sm }}>
              {t('consent.title')}
            </Text>
          </LinearGradient>

          {/* Content */}
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            <Text variant="body" style={{ marginBottom: theme.spacing.md }}>
              {t('consent.description')}
            </Text>

            {/* Required Consent */}
            <Card glass style={styles.consentCard}>
              <View style={styles.consentHeader}>
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
                <Text variant="body" style={{ marginLeft: theme.spacing.sm, flex: 1, fontWeight: '600' }}>
                  {t('consent.dataProcessingTitle')}
                </Text>
                <Text variant="caption" color="error" style={styles.requiredBadge}>
                  {t('common.required')}
                </Text>
              </View>
              <Text variant="caption" color="textSecondary" style={{ marginTop: theme.spacing.sm }}>
                {t('consent.dataProcessingDescription')}
              </Text>
              <View style={styles.consentToggle}>
                <Text variant="caption" color="textSecondary">
                  {t('consent.iConsent')}
                </Text>
                <Switch
                  value={dataProcessingConsent}
                  onValueChange={setDataProcessingConsent}
                  trackColor={{ false: theme.colors.border, true: theme.colors.success }}
                  thumbColor={theme.colors.surface}
                  disabled // Required, can't be disabled
                />
              </View>
            </Card>

            {/* Optional Marketing Consent */}
            <Card glass style={styles.consentCard}>
              <View style={styles.consentHeader}>
                <Ionicons name="mail" size={24} color={theme.colors.primary} />
                <Text variant="body" style={{ marginLeft: theme.spacing.sm, flex: 1, fontWeight: '600' }}>
                  {t('consent.marketingTitle')}
                </Text>
                <Text variant="caption" color="textSecondary" style={styles.optionalBadge}>
                  {t('common.optional')}
                </Text>
              </View>
              <Text variant="caption" color="textSecondary" style={{ marginTop: theme.spacing.sm }}>
                {t('consent.marketingDescription')}
              </Text>
              <View style={styles.consentToggle}>
                <Text variant="caption" color="textSecondary">
                  {t('consent.iConsent')}
                </Text>
                <Switch
                  value={marketingConsent}
                  onValueChange={setMarketingConsent}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor={theme.colors.surface}
                />
              </View>
            </Card>

            {/* Info Text */}
            <Card glass style={[styles.consentCard, { backgroundColor: `${theme.colors.info}10` }]}>
              <Ionicons name="information-circle" size={20} color={theme.colors.info} />
              <Text variant="caption" color="textSecondary" style={{ marginTop: theme.spacing.xs }}>
                {t('consent.changeAnytime')}
              </Text>
            </Card>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              variant="primary"
              onPress={handleAccept}
              disabled={!dataProcessingConsent}
              style={{ marginBottom: theme.spacing.sm }}
            >
              {t('consent.acceptAndContinue')}
            </Button>
            <Button variant="outline" onPress={onDecline}>
              {t('consent.decline')}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    padding: 24,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  consentCard: {
    padding: 16,
    marginBottom: 12,
  },
  consentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requiredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  optionalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  consentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
});

