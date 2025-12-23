/**
 * LOG ACTIVITY SCREEN
 * 
 * Screen for creating and editing activities with modern UI.
 */

import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Switch, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Input, Text, type SelectOption } from '../components/ui';
import { useActivities } from '../hooks/useActivities';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import { ActivityType } from '../types';

type DurationUnit = 'minutes' | 'hours' | 'days';

export function LogActivityScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const { createActivity, loading } = useActivities('all');
  
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ActivityType>('training');
  const [falseAlarm, setFalseAlarm] = useState(false);
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [durationValue, setDurationValue] = useState('');
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('hours');
  const [report, setReport] = useState('');
  const [town, setTown] = useState('');
  const [street, setStreet] = useState('');
  
  const styles = createStyles(theme);
  
  const durationUnitOptions: SelectOption[] = [
    { label: t('activity.unitMinutes'), value: 'minutes' },
    { label: t('activity.unitHours'), value: 'hours' },
    { label: t('activity.unitDays'), value: 'days' },
  ];
  
  // Convert duration to minutes for backend
  const convertDurationToMinutes = (value: number, unit: DurationUnit): number => {
    switch (unit) {
      case 'hours':
        return value * 60;
      case 'days':
        return value * 60 * 24;
      case 'minutes':
      default:
        return value;
    }
  };
  
  const handleSave = async () => {
    // Validation
    if (!durationValue.trim() || isNaN(Number(durationValue)) || Number(durationValue) <= 0) {
      Alert.alert(t('errors.validation'), t('activity.durationRequired'));
      return;
    }
    
    if (!user) {
      Alert.alert(t('errors.auth'), t('errors.notAuthenticated'));
      return;
    }
    
    try {
      const durationInMinutes = convertDurationToMinutes(Number(durationValue), durationUnit);
      const location = [street, town].filter(Boolean).join(', ') || undefined;
      
      await createActivity({
        type,
        title,
        description: report.trim() || undefined,
        duration: durationInMinutes,
        date,
        location,
        unitId: user.unitId,
        visibility: 'unit',
        tags: category ? [category] : undefined,
      });
      
      Alert.alert(
        t('common.success'),
        t('activity.saveSuccess'),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              // Clear form
              setTitle('');
              setType('training');
              setFalseAlarm(false);
              setCategory('');
              setDate(new Date());
              setDurationValue('');
              setDurationUnit('hours');
              setReport('');
              setTown('');
              setStreet('');
              
              // Navigate to logbook to see the new activity
              router.push('/(tabs)/logbook');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to save activity:', error);
      Alert.alert(t('errors.generic'), t('activity.saveError'));
    }
  };
  
  const getTypeColor = (activityType: ActivityType) => {
    switch (activityType) {
      case 'training': return theme.colors.info;
      case 'exercise': return theme.colors.warning;
      case 'operation': return theme.colors.error;
      default: return theme.colors.primary;
    }
  };
  
  const getTypeIcon = (activityType: ActivityType) => {
    switch (activityType) {
      case 'training': return 'book-outline';
      case 'exercise': return 'fitness-outline';
      case 'operation': return 'flash-outline';
      default: return 'flag-outline';
    }
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
        <Text variant="headingLarge" style={{ color: '#FFFFFF' }}>{t('activity.logNew')}</Text>
      </LinearGradient>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          {/* Step 1: Activity Type & Title */}
          <View style={styles.sectionHeader}>
            <View style={styles.stepNumber}>
              <Text variant="label" style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.sectionHeaderContent}>
              <Text variant="headingSmall" style={styles.sectionHeaderTitle}>
                {t('activity.basicInfo')}
              </Text>
              <Text variant="caption" color="textSecondary">
                {t('activity.type')} & {t('activity.titleLabel')}
              </Text>
            </View>
          </View>
          
          <View style={styles.typeSelector}>
            {(['training', 'exercise', 'operation'] as ActivityType[]).map((activityType) => {
              const isSelected = type === activityType;
              const typeColor = getTypeColor(activityType);
              const typeLabel = activityType === 'training' 
                ? t('activity.typeTraining')
                : activityType === 'exercise'
                ? t('activity.typeExercise')
                : t('activity.typeOperation');
              
              return (
                <TouchableOpacity
                  key={activityType}
                  style={[
                    styles.typeButton,
                    isSelected && { 
                      backgroundColor: typeColor, 
                      borderColor: typeColor,
                    }
                  ]}
                  onPress={() => setType(activityType)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={getTypeIcon(activityType) as any}
                    size={28}
                    color={isSelected ? '#FFFFFF' : typeColor}
                  />
                  <Text
                    variant="caption"
                    style={{ 
                      color: isSelected ? '#FFFFFF' : theme.colors.textPrimary,
                      fontWeight: '600',
                      marginTop: theme.spacing.xs,
                    }}
                  >
                    {typeLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          <Card style={styles.section} glass elevated>
            <Input
              label={t('activity.titleLabel')}
              value={title}
              onChangeText={setTitle}
              placeholder={t('activity.titlePlaceholder')}
            />
            
            {/* Operation-specific fields */}
            {type === 'operation' && (
              <>
                <View style={styles.divider} />
                <View style={styles.switchRow}>
                  <View style={styles.switchLabel}>
                    <Ionicons name="alert-circle-outline" size={20} color={theme.colors.textSecondary} />
                    <Text variant="body">{t('activity.falseAlarm')}</Text>
                  </View>
                  <Switch
                    value={falseAlarm}
                    onValueChange={setFalseAlarm}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    thumbColor={falseAlarm ? theme.colors.onPrimary : theme.colors.surface}
                    ios_backgroundColor={theme.colors.border}
                  />
                </View>
                
                <Input
                  label={t('activity.category')}
                  value={category}
                  onChangeText={setCategory}
                  placeholder={t('activity.categoryPlaceholder')}
                />
              </>
            )}
          </Card>
          
          {/* Step 2: Time & Duration */}
          <View style={styles.sectionHeader}>
            <View style={styles.stepNumber}>
              <Text variant="label" style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.sectionHeaderContent}>
              <Text variant="headingSmall" style={styles.sectionHeaderTitle}>
                {type === 'operation' ? t('activity.alarmTime') : t('activity.timeAndDuration')}
              </Text>
              <Text variant="caption" color="textSecondary">
                {t('activity.date')}, {t('activity.time')} & {t('activity.duration')}
              </Text>
            </View>
          </View>
          
          <Card style={styles.section} glass elevated>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                <Text variant="body">
                  {date.toLocaleDateString('de-DE')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                <Text variant="body">
                  {date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
            </View>
            
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_event: any, selectedDate?: Date) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setDate(selectedDate);
                  }
                }}
              />
            )}
            
            {showTimePicker && (
              <DateTimePicker
                value={date}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_event: any, selectedDate?: Date) => {
                  setShowTimePicker(false);
                  if (selectedDate) {
                    setDate(selectedDate);
                  }
                }}
              />
            )}
            
            <View style={styles.divider} />
            
            <Text variant="label" color="textSecondary" style={styles.fieldLabel}>
              {t('activity.duration')} <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.durationRow}>
              <View style={styles.durationInputWrapper}>
                <Input
                  value={durationValue}
                  onChangeText={setDurationValue}
                  placeholder="2"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.durationUnitWrapper}>
                <View style={styles.unitButtons}>
                  {durationUnitOptions.map((unit) => (
                    <TouchableOpacity
                      key={unit.value}
                      style={[
                        styles.unitButton,
                        durationUnit === unit.value && styles.unitButtonActive,
                      ]}
                      onPress={() => setDurationUnit(unit.value as DurationUnit)}
                      activeOpacity={0.7}
                    >
                      <Text
                        variant="caption"
                        color={durationUnit === unit.value ? 'textInverse' : 'textSecondary'}
                        style={styles.unitButtonText}
                      >
                        {unit.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </Card>
          
          {/* Step 3: Location (Optional) */}
          <View style={styles.sectionHeader}>
            <View style={styles.stepNumber}>
              <Text variant="label" style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.sectionHeaderContent}>
              <Text variant="headingSmall" style={styles.sectionHeaderTitle}>
                {t('activity.location')}
              </Text>
              <Text variant="caption" color="textSecondary">
                {t('common.optional')}
              </Text>
            </View>
          </View>
          
          <Card style={styles.section} glass elevated>
            <Input
              label={t('activity.town')}
              value={town}
              onChangeText={setTown}
              placeholder={t('activity.townPlaceholder')}
            />
            
            <Input
              label={t('activity.street')}
              value={street}
              onChangeText={setStreet}
              placeholder={t('activity.streetPlaceholder')}
            />
          </Card>
          
          {/* Step 4: Report (Optional) */}
          <View style={styles.sectionHeader}>
            <View style={styles.stepNumber}>
              <Text variant="label" style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.sectionHeaderContent}>
              <Text variant="headingSmall" style={styles.sectionHeaderTitle}>
                {t('activity.report')}
              </Text>
              <Text variant="caption" color="textSecondary">
                {t('activity.details')} - {t('common.optional')}
              </Text>
            </View>
          </View>
          
          <Card style={styles.section} glass elevated>
            <Input
              value={report}
              onChangeText={setReport}
              placeholder={t('activity.reportPlaceholder')}
              multiline
              numberOfLines={6}
            />
          </Card>
 
          {/* Save Button */}
          <Button
            variant="primary"
            onPress={handleSave}
            style={styles.saveButton}
            disabled={loading}
          >
            {loading ? (
              <Text variant="body" color="textInverse">{t('common.saving')}</Text>
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text variant="body" color="textInverse" style={styles.buttonText}>
                  {t('activity.save')}
                </Text>
              </View>
            )}
          </Button>
          
          {/* Bottom padding for keyboard */}
          <View style={styles.bottomPadding} />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
    keyboardView: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: theme.spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.xs,
    },
    stepNumber: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepNumberText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    sectionHeaderContent: {
      flex: 1,
    },
    sectionHeaderTitle: {
      marginBottom: 2,
    },
    typeSelector: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    typeButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 2,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      minHeight: 80,
    },
    section: {
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: theme.spacing.md,
    },
    durationRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      alignItems: 'center',
    },
    durationInputWrapper: {
      flex: 1,
    },
    durationUnitWrapper: {
      flex: 1,
    },
    unitLabel: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: '500',
      marginBottom: theme.spacing.xs,
    },
    unitButtons: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.xs,
    },
    unitButton: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    unitButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    unitButtonText: {
      fontWeight: '600',
      fontSize: theme.typography.fontSize.xs,
    },
    saveButton: {
      marginTop: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
    },
    buttonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
    },
    buttonText: {
      fontWeight: '600',
      fontSize: theme.typography.fontSize.base,
    },
    bottomPadding: {
      height: theme.spacing.xxl,
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.xs,
    },
    switchLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: theme.spacing.sm,
    },
    required: {
      color: theme.colors.error,
      fontWeight: '700',
    },
    fieldLabel: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: '500',
      marginBottom: theme.spacing.sm,
    },
    dateTimeRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    dateTimeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
  });
}
