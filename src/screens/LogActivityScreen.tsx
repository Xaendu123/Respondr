/**
 * LOG ACTIVITY SCREEN
 * 
 * Screen for creating and editing activities with modern, user-friendly UI.
 */

import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, Platform, StatusBar, StyleSheet, Switch, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Input, Text, type SelectOption } from '../components/ui';
import { useActivities } from '../hooks/useActivities';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import { ActivityType, ActivityVisibility } from '../types';
import { hapticSelect, hapticSuccess } from '../utils/haptics';

type DurationUnit = 'minutes' | 'hours' | 'days';

export function LogActivityScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const { createActivity, loading } = useActivities('all');
  const insets = useSafeAreaInsets();
  
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
  const [visibility, setVisibility] = useState<ActivityVisibility>('public');
  
  // Validation errors
  const [titleError, setTitleError] = useState('');
  const [durationError, setDurationError] = useState('');
  
  const styles = createStyles(theme);
  
  
  const durationUnitOptions: SelectOption[] = [
    { label: t('activity.unitMinutes'), value: 'minutes' },
    { label: t('activity.unitHours'), value: 'hours' },
    { label: t('activity.unitDays'), value: 'days' },
  ];
  
  // Check if form is valid
  const isFormValid = title.trim().length > 0 && 
    durationValue.trim().length > 0 && 
    !isNaN(Number(durationValue)) && 
    Number(durationValue) > 0;
  
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
  
  const validateTitle = (value: string) => {
    if (!value.trim()) {
      setTitleError(t('activity.titleRequired'));
      return false;
    }
    setTitleError('');
    return true;
  };
  
  const validateDuration = (value: string) => {
    if (!value.trim() || isNaN(Number(value)) || Number(value) <= 0) {
      setDurationError(t('activity.durationRequired'));
      return false;
    }
    setDurationError('');
    return true;
  };
  
  
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (titleError) {
      validateTitle(value);
    }
  };
  
  const handleDurationChange = (value: string) => {
    setDurationValue(value);
    if (durationError) {
      validateDuration(value);
    }
  };
  
  const handleSave = async () => {
    // Validate
    const isTitleValid = validateTitle(title);
    const isDurationValid = validateDuration(durationValue);
    
    if (!isTitleValid || !isDurationValid) {
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
        visibility,
        tags: category ? [category] : undefined,
      });
      
      hapticSuccess();
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
              setVisibility('public');
              setTitleError('');
              setDurationError('');
              
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
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.gradientStart} translucent={true} />
      {/* Header with Gradient */}
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Ionicons name="add-circle-outline" size={28} color="#FFFFFF" />
          <Text variant="headingLarge" style={styles.headerTitle}>{t('activity.logNew')}</Text>
        </View>
      </LinearGradient>
      
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAwareScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { 
              flexGrow: 1,
              paddingBottom: theme.spacing.xl + insets.bottom + 60 
            }
          ]}
          enableOnAndroid
          enableAutomaticScroll
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={24}
          showsVerticalScrollIndicator={false}
          bounces={true}
          alwaysBounceVertical={true}
        >
            {/* Activity Type Selection */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderIcon}>
                <Ionicons name="flag-outline" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.sectionHeaderContent}>
                <Text variant="headingMedium" style={styles.sectionHeaderTitle}>
                  {t('activity.type')}
                </Text>
                <Text variant="caption" color="textSecondary">
                  {t('activity.selectType')}
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
                        shadowColor: typeColor,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 8,
                      }
                    ]}
                    onPress={() => {
                      hapticSelect();
                      setType(activityType);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={getTypeIcon(activityType) as any}
                      size={32}
                      color={isSelected ? '#FFFFFF' : typeColor}
                    />
                    <Text
                      variant="body"
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
            
            {/* Basic Information */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderIcon}>
                <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.sectionHeaderContent}>
                <Text variant="headingMedium" style={styles.sectionHeaderTitle}>
                  {t('activity.basicInfo')}
                </Text>
                <Text variant="caption" color="textSecondary">
                  {t('activity.titleLabel')} {t('common.required')}
                </Text>
              </View>
            </View>
            
            <Card style={styles.section} glass elevated>
              <View style={styles.fieldLabelContainer}>
                <Text variant="label" color="textSecondary" style={styles.fieldLabel}>
                  {t('activity.titleLabel')} <Text style={styles.required}>*</Text>
                </Text>
              </View>
              <Input
                value={title}
                onChangeText={handleTitleChange}
                placeholder={t('activity.titlePlaceholder')}
                error={titleError}
                autoFocus={false}
              />
              
              {/* Operation-specific fields */}
              {type === 'operation' && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.switchRow}>
                    <View style={styles.switchLabel}>
                      <Ionicons name="alert-circle-outline" size={20} color={theme.colors.textSecondary} />
                      <View style={styles.switchTextContainer}>
                        <Text variant="body">{t('activity.falseAlarm')}</Text>
                        <Text variant="caption" color="textSecondary" style={styles.switchHint}>
                          {t('activity.falseAlarmHint')}
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={falseAlarm}
                      onValueChange={(value) => {
                        hapticSelect();
                        setFalseAlarm(value);
                      }}
                      trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                      thumbColor={falseAlarm ? theme.colors.onPrimary : theme.colors.surface}
                      ios_backgroundColor={theme.colors.border}
                    />
                  </View>
                  
                  {falseAlarm && (
                    <View style={styles.infoBox}>
                      <Ionicons name="information-circle-outline" size={18} color={theme.colors.info} />
                      <Text variant="caption" color="textSecondary" style={styles.infoText}>
                        {t('activity.falseAlarmNote')}
                      </Text>
                    </View>
                  )}
                  
                  <Input
                    label={t('activity.category')}
                    value={category}
                    onChangeText={setCategory}
                    placeholder={t('activity.categoryPlaceholder')}
                  />
                </>
              )}
            </Card>
            
            {/* Time & Duration */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderIcon}>
                <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.sectionHeaderContent}>
                <Text variant="headingMedium" style={styles.sectionHeaderTitle}>
                  {type === 'operation' ? t('activity.alarmTime') : t('activity.timeAndDuration')}
                </Text>
                <Text variant="caption" color="textSecondary">
                  {t('activity.date')}, {t('activity.time')} & {t('activity.duration')}
                </Text>
              </View>
            </View>
            
            <Card style={styles.section} glass elevated>
              <View style={styles.fieldLabelContainer}>
                <Text variant="label" color="textSecondary" style={styles.fieldLabel}>
                  {type === 'operation' ? t('activity.alarmTime') : t('activity.date')} <Text style={styles.required}>*</Text>
                </Text>
              </View>
              <View style={styles.dateTimeRow}>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => {
                    hapticSelect();
                    setShowDatePicker(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                  <Text variant="body">
                    {date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => {
                    hapticSelect();
                    setShowTimePicker(true);
                  }}
                  activeOpacity={0.7}
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
              
              <View style={styles.fieldLabelContainer}>
                <Text variant="label" color="textSecondary" style={styles.fieldLabel}>
                  {t('activity.duration')} <Text style={styles.required}>*</Text>
                </Text>
              </View>
              <View style={styles.durationRow}>
                <View style={styles.durationInputWrapper}>
                  <Input
                    value={durationValue}
                    onChangeText={handleDurationChange}
                    placeholder="2"
                    keyboardType="numeric"
                    error={durationError}
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
                        onPress={() => {
                          hapticSelect();
                          setDurationUnit(unit.value as DurationUnit);
                        }}
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
            
            {/* Location (Optional) */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderIcon}>
                <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.sectionHeaderContent}>
                <Text variant="headingMedium" style={styles.sectionHeaderTitle}>
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
              <View style={styles.fieldHint}>
                <Ionicons name="information-circle-outline" size={16} color={theme.colors.textTertiary} />
                <Text variant="caption" color="textTertiary" style={styles.hintText}>
                  {t('activity.streetPrivacyHint')}
                </Text>
              </View>
            </Card>
            
            {/* Report (Optional) */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderIcon}>
                <Ionicons name="document-outline" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.sectionHeaderContent}>
                <Text variant="headingMedium" style={styles.sectionHeaderTitle}>
                  {t('activity.report')}
                </Text>
                <Text variant="caption" color="textSecondary">
                  {t('activity.details')} - {t('common.optional')}
                </Text>
              </View>
            </View>
            
            <Card style={styles.section} glass elevated>
              <TextInput
                value={report}
                onChangeText={setReport}
                placeholder={t('activity.reportPlaceholder')}
                placeholderTextColor={theme.colors.textTertiary}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                style={[
                  styles.reportTextInput,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.textPrimary,
                  }
                ]}
              />
              <View style={styles.characterCount}>
                <Text variant="caption" color="textTertiary">
                  {report.length} {t('common.characters')}
                </Text>
              </View>
            </Card>
            
            {/* Visibility */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderIcon}>
                <Ionicons name="eye-outline" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.sectionHeaderContent}>
                <Text variant="headingMedium" style={styles.sectionHeaderTitle}>
                  {t('activity.visibility')}
                </Text>
                <Text variant="caption" color="textSecondary">
                  {t('activity.visibilityDescription')}
                </Text>
              </View>
            </View>
            
            <Card style={styles.section} glass elevated>
              <View style={styles.visibilityOptions}>
                {[
                  { value: 'public' as ActivityVisibility, label: t('activity.visibilityPublic'), icon: 'earth', description: t('activity.visibilityPublicDesc') },
                  { value: 'unit' as ActivityVisibility, label: t('activity.visibilityUnit'), icon: 'people', description: t('activity.visibilityUnitDesc') },
                  { value: 'private' as ActivityVisibility, label: t('activity.visibilityPrivate'), icon: 'lock-closed', description: t('activity.visibilityPrivateDesc') },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.visibilityOption}
                    onPress={() => {
                      hapticSelect();
                      setVisibility(option.value);
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.visibilityOptionContent,
                        visibility === option.value && {
                          borderColor: theme.colors.primary,
                          borderWidth: 2,
                          backgroundColor: `${theme.colors.primary}15`,
                        },
                      ]}
                    >
                      <Ionicons
                        name={option.icon as any}
                        size={28}
                        color={visibility === option.value ? theme.colors.primary : theme.colors.textSecondary}
                      />
                      <Text
                        variant="body"
                        style={{
                          marginTop: theme.spacing.xs,
                          color: visibility === option.value ? theme.colors.primary : theme.colors.textPrimary,
                          fontWeight: visibility === option.value ? '600' : '500',
                        }}
                      >
                        {option.label}
                      </Text>
                      <Text
                        variant="caption"
                        style={{
                          marginTop: theme.spacing.xxs,
                          color: visibility === option.value ? theme.colors.textSecondary : theme.colors.textTertiary,
                          textAlign: 'center',
                        }}
                      >
                        {option.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            {/* Save Button */}
            <View style={styles.saveButtonContainer} pointerEvents="box-none">
              <Button
                variant="primary"
                onPress={handleSave}
                style={styles.saveButton}
                disabled={loading || !isFormValid}
              >
                {loading ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text variant="body" style={[styles.buttonText, { color: '#FFFFFF', marginLeft: theme.spacing.sm }]}>
                      {t('common.saving')}
                    </Text>
                  </View>
                ) : !isFormValid ? (
                  <View style={styles.buttonContent}>
                    <Ionicons name="alert-circle-outline" size={20} color="#FFFFFF" />
                    <Text variant="body" style={[styles.buttonText, { color: '#FFFFFF', marginLeft: theme.spacing.sm }]}>
                      {t('activity.completeRequired')}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text variant="body" style={[styles.buttonText, { color: '#FFFFFF', marginLeft: theme.spacing.sm }]}>
                      {t('activity.save')}
                    </Text>
                  </View>
                )}
              </Button>
            </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
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
      paddingTop: 60,
      paddingBottom: theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    headerTitle: {
      color: '#FFFFFF',
    },
    keyboardView: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: theme.spacing.lg,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.xs,
    },
    sectionHeaderIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: `${theme.colors.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    sectionHeaderContent: {
      flex: 1,
    },
    sectionHeaderTitle: {
      marginBottom: 2,
    },
    typeSelector: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    typeButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.lg,
      borderRadius: theme.borderRadius.xl,
      borderWidth: 2,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      minHeight: 100,
    },
    section: {
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: theme.spacing.md,
    },
    required: {
      color: theme.colors.error,
      fontWeight: '700',
    },
    fieldLabel: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: '600',
      marginBottom: theme.spacing.sm,
    },
    fieldLabelContainer: {
      marginBottom: theme.spacing.xs,
    },
    dateTimeRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
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
    durationRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      alignItems: 'flex-start',
    },
    durationInputWrapper: {
      flex: 1,
    },
    durationUnitWrapper: {
      flex: 1,
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
    visibilityOptions: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    visibilityOption: {
      flex: 1,
    },
    visibilityOptionContent: {
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      height: 120,
      width: '100%',
    },
    saveButtonContainer: {
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.md,
    },
    saveButton: {
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
    },
    buttonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      fontWeight: '600',
      fontSize: theme.typography.fontSize.base,
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: theme.spacing.xs,
    },
    switchLabel: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
      flex: 1,
    },
    switchTextContainer: {
      flex: 1,
    },
    switchHint: {
      marginTop: theme.spacing.xxs,
    },
    infoBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      backgroundColor: `${theme.colors.info}15`,
      borderRadius: theme.borderRadius.md,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.info,
    },
    infoText: {
      flex: 1,
      lineHeight: 18,
    },
    textArea: {
      minHeight: 120,
      paddingTop: theme.spacing.md,
    },
    reportTextInput: {
      minHeight: 120,
      paddingTop: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      fontSize: theme.typography.fontSize.base,
      marginBottom: 16,
    },
    characterCount: {
      alignItems: 'flex-end',
      marginTop: theme.spacing.xs,
    },
    fieldHint: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xs,
    },
    hintText: {
      flex: 1,
      lineHeight: 18,
    },
  });
}
