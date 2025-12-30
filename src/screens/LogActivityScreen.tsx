/**
 * LOG ACTIVITY SCREEN
 * 
 * Screen for creating and editing activities with modern, user-friendly UI.
 */

import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, LayoutAnimation, Platform, StatusBar, StyleSheet, Switch, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input, Select, Text, type SelectOption } from '../components/ui';
import { useActivities } from '../hooks/useActivities';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import { Activity, ActivityType, ActivityVisibility } from '../types';
import { hapticSelect, hapticSuccess } from '../utils/haptics';

type DurationUnit = 'minutes' | 'hours' | 'days';

export function LogActivityScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    activityId?: string;
    formMode?: 'new' | 'edit';
    activityData?: string; // JSON stringified activity
    _ts?: string; // Timestamp to force param change
  }>();
  
  // Get form mode and selected activity from params
  // Initialize from params, but make it state so it can be reset
  const initialFormMode = params.formMode || (params.activityId ? 'edit' : 'new');
  const [formMode, setFormMode] = useState<'new' | 'edit'>(initialFormMode);
  
  // Helper function to parse activity data from params
  const parseActivityDataFromParams = (): Activity | null => {
    // Treat empty strings as no data (when params are cleared)
    if (params.activityData && params.activityData.trim() !== '') {
      try {
        return JSON.parse(params.activityData) as Activity;
      } catch (e) {
        console.error('Failed to parse activity data:', e);
        return null;
      }
    }
    return null;
  };
  
  // Initialize selectedActivity from params, but make it state so it can be reset
  const initialActivityData = parseActivityDataFromParams();
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(initialActivityData);
  
  // Update formMode and selectedActivity when params change
  // formMode is 'edit' ONLY if params.formMode is 'edit' AND selectedActivity exists
  useEffect(() => {
    const activityData = parseActivityDataFromParams();
    // Treat empty string as 'new' mode (when params are cleared)
    const newFormMode = (params.formMode === 'edit' && activityData) ? 'edit' : 'new';
    console.log('🔄 Updating formMode and selectedActivity from params:', { 
      paramsFormMode: params.formMode, 
      activityDataExists: !!activityData,
      newFormMode
    });
    setFormMode(newFormMode);
    // Always create a new object reference to ensure React sees it as changed
    // This allows the load effect to run even when clicking edit on the same activity twice
    setSelectedActivity(activityData ? { ...activityData } : null);
  }, [params.formMode, params.activityData, params._ts]); // Include _ts to force re-run on navigation
  
  const activityId = params.activityId || selectedActivity?.id;
  
  // Use 'mine' filter when editing to ensure we can find the user's activity
  // Use 'all' when creating new activities
  const { createActivity, updateActivity, loading, activities, refresh } = useActivities(formMode === 'edit' ? 'mine' : 'all');
  const insets = useSafeAreaInsets();
  
  // Reset form and form mode
  const resetForm = useCallback(() => {
    console.log('🔄 Starting form reset (0%)');
    
    // Reset all form fields
    setTitle('');
    console.log('✅ Reset title (7%)');
    
    setType('exercise');
    console.log('✅ Reset type (14%)');
    
    setFalseAlarm(false);
    console.log('✅ Reset falseAlarm (21%)');
    
    setCategory('');
    console.log('✅ Reset category (29%)');
    
    setDate(new Date());
    console.log('✅ Reset date (36%)');
    
    setDurationValue('');
    console.log('✅ Reset durationValue (43%)');
    
    setDurationUnit('hours');
    console.log('✅ Reset durationUnit (50%)');
    
    setReport('');
    console.log('✅ Reset report (57%)');
    
    setTown('');
    console.log('✅ Reset town (64%)');
    
    setStreet('');
    console.log('✅ Reset street (71%)');
    
    setVisibility('public');
    console.log('✅ Reset visibility (79%)');
    
    setTitleError('');
    console.log('✅ Reset titleError (86%)');
    
    setDurationError('');
    console.log('✅ Reset durationError (93%)');
    
    setExpandedSections({
      type: true,
      basicInfo: true,
      timeDuration: false,
      location: false,
      report: false,
      visibility: false,
    });
    console.log('✅ Reset expandedSections (93%)');
    
    // Reset form mode and selectedActivity (same pattern as formMode)
    setFormMode('new');
    setSelectedActivity(null);
    console.log('✅ Reset formMode to "new" and selectedActivity to null (100%)');
    
    // Clear route params
    router.setParams({
      activityId: '',
      formMode: '',
      activityData: '',
    });
    console.log('✅ Cleared route params (activityId, formMode, activityData)');
    console.log('✅ Form reset complete - all fields, mode, and selectedActivity reset');
  }, [router, setFormMode, setSelectedActivity]);
  
  // Reset form when leaving the screen
  useFocusEffect(
    useCallback(() => {
      // Cleanup function runs when screen loses focus
      return () => {
        resetForm();
      };
    }, [resetForm])
  );
  
  // TEMPORARY DEBUG - Remove after fixing
  console.log('=== RENDER ===');
  console.log('formMode:', formMode);
  console.log('selectedActivity:', selectedActivity?.title);
  console.log('==============');
  
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ActivityType>('exercise');
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
  
  // Expandable sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    type: true, // Activity type always expanded
    basicInfo: true, // Basic info expanded by default
    timeDuration: false,
    location: false,
    report: false,
    visibility: false,
  });
  
  const toggleSection = useCallback((sectionKey: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
    hapticSelect();
  }, []);
  
  const styles = createStyles(theme);
  
  
  const durationUnitOptions: SelectOption[] = [
    { label: t('activity.unitMinutes'), value: 'minutes' },
    { label: t('activity.unitHours'), value: 'hours' },
    { label: t('activity.unitDays'), value: 'days' },
  ];
  
  // Operation category options based on incident classification table
  const operationCategoryOptions: SelectOption[] = [
    // No category option
    { label: t('activity.noCategory'), value: '' },
    // Brand (Fire) - A1, A2, A3
    { label: t('activity.categoryA1'), value: 'A1 - Brand klein' },
    { label: t('activity.categoryA2'), value: 'A2 - Brand mittel' },
    { label: t('activity.categoryA3'), value: 'A3 - Brand gross' },
    // Elementar (Elemental) - B1, B2, B3
    { label: t('activity.categoryB1'), value: 'B1 - Elementar klein' },
    { label: t('activity.categoryB2'), value: 'B2 - Elementar mittel' },
    { label: t('activity.categoryB3'), value: 'B3 - Elementar gross' },
    // Hilfeleistung (Assistance) - C1, C2, C3
    { label: t('activity.categoryC1'), value: 'C1 - Hilfeleistung klein' },
    { label: t('activity.categoryC2'), value: 'C2 - Hilfeleistung mittel' },
    { label: t('activity.categoryC3'), value: 'C3 - Hilfeleistung gross' },
    // Öl/Benzin/Gas (Oil/Petrol/Gas) - D1, D2, D3
    { label: t('activity.categoryD1'), value: 'D1 - Öl/Benzin/Gas klein' },
    { label: t('activity.categoryD2'), value: 'D2 - Öl/Benzin/Gas mittel' },
    { label: t('activity.categoryD3'), value: 'D3 - Öl/Benzin/Gas gross' },
    // ABC - E1, E2, E3
    { label: t('activity.categoryE1'), value: 'E1 - ABC klein' },
    { label: t('activity.categoryE2'), value: 'E2 - ABC mittel' },
    { label: t('activity.categoryE3'), value: 'E3 - ABC gross' },
    // PbU (Person in danger) - F1, F2, F3
    { label: t('activity.categoryF1'), value: 'F1 - PbU klein' },
    { label: t('activity.categoryF2'), value: 'F2 - PbU mittel' },
    { label: t('activity.categoryF3'), value: 'F3 - PbU gross' },
    // Tierrettung (Animal Rescue) - G1, G2 (G3 not available)
    { label: t('activity.categoryG1'), value: 'G1 - Tierrettung klein' },
    { label: t('activity.categoryG2'), value: 'G2 - Tierrettung mittel' },
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
  
  // Convert duration from minutes to display format
  const convertDurationFromMinutes = (minutes: number): { value: number; unit: DurationUnit } => {
    if (minutes >= 1440) {
      // 24 hours or more - use days
      return { value: Math.round((minutes / 1440) * 10) / 10, unit: 'days' };
    } else if (minutes >= 60) {
      // 1 hour or more - use hours
      return { value: Math.round((minutes / 60) * 10) / 10, unit: 'hours' };
    } else {
      // Less than 1 hour - use minutes
      return { value: minutes, unit: 'minutes' };
    }
  };
  
  
  // Load activity data when entering edit mode
  useEffect(() => {
    console.log('📂 Load effect triggered');
    console.log('formMode:', formMode);
    console.log('activityId:', activityId);
    
    // Exit early if not in edit mode
    if (formMode !== 'edit') {
      console.log('❌ Not in edit mode');
      return;
    }
    
    // Use selectedActivity directly - it's state just like formMode
    if (!selectedActivity) {
      console.log('⚠️ Waiting for activity data to load...');
      return;
    }
    
    console.log('📥 Loading activity data:', activityId);
    
    // Load the activity data from selectedActivity
    setTitle(selectedActivity.title);
    setType(selectedActivity.type);
    setDate(new Date(selectedActivity.date));
    
    const duration = convertDurationFromMinutes(selectedActivity.duration);
    setDurationValue(duration.value.toString());
    setDurationUnit(duration.unit);
    
    if (selectedActivity.location) {
      const locationParts = selectedActivity.location.split(',').map((s: string) => s.trim());
      if (locationParts.length >= 2) {
        setStreet(locationParts[0]);
        setTown(locationParts.slice(1).join(', '));
      } else {
        setTown(selectedActivity.location);
      }
    } else {
      setStreet('');
      setTown('');
    }
    
    setReport(selectedActivity.description || '');
    setVisibility(selectedActivity.visibility);
    setCategory(selectedActivity.category?.trim() || '');
    setFalseAlarm(selectedActivity.falseAlarm || false);
    
    console.log('✅ Activity loaded successfully');
  }, [
    formMode,
    selectedActivity, // Use state variable just like formMode
    activityId, // Include activityId to force re-run when same activity is selected again
    params.activityData // Also depend on raw param to trigger on navigation, even for same activity
  ]);
  
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
    
    if (formMode === 'edit' && !activityId) {
      Alert.alert(t('errors.generic'), t('activity.editError'));
      return;
    }
    
    try {
      const durationInMinutes = convertDurationToMinutes(Number(durationValue), durationUnit);
      // For operations, don't include street in location (privacy/security)
      const locationParts = type === 'operation' 
        ? [town].filter(Boolean)
        : [street, town].filter(Boolean);
      const location = locationParts.join(', ') || undefined;
      
      if (formMode === 'edit' && activityId) {
        // Update existing activity
        await updateActivity(activityId, {
          type,
          title,
          description: report.trim() || undefined,
          duration: durationInMinutes,
          date,
          location,
          visibility,
          category: type === 'operation' ? category : undefined,
          falseAlarm: type === 'operation' ? falseAlarm : undefined,
        });
        
        hapticSuccess();
        
        Alert.alert(
          t('common.success'),
          t('activity.updateSuccess'),
          [
            {
              text: t('common.ok'),
              onPress: () => {
                // Reset form and navigate back to logbook
                router.replace('/(tabs)/logbook');
              },
            },
          ]
        );
      } else {
        // Create new activity
        await createActivity({
          type,
          title,
          description: report.trim() || undefined,
          duration: durationInMinutes,
          date,
          location,
          unitId: user.unitId,
          visibility,
          category: type === 'operation' ? category : undefined,
          falseAlarm: type === 'operation' ? falseAlarm : undefined,
        });
        
        hapticSuccess();
        Alert.alert(
          t('common.success'),
          t('activity.saveSuccess'),
          [
            {
              text: t('common.ok'),
              onPress: () => {
                // Reset form and navigate to logbook to see the new activity
                resetForm();
                router.push('/(tabs)/logbook');
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Failed to save activity:', error);
      Alert.alert(
        t('errors.generic'), 
        formMode === 'edit' ? t('activity.updateError') : t('activity.saveError')
      );
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
        <Text variant="headingLarge" style={{ color: '#FFFFFF' }}>
          {formMode === 'edit' ? t('activity.edit') : t('activity.logNew')}
        </Text>
      </LinearGradient>
      
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAwareScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { 
              flexGrow: 1,
              paddingBottom: theme.spacing.lg + insets.bottom + 60 
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
            {/* Unified Form Container */}
            <View style={styles.unifiedFormContainer}>
            {/* Basic Information - Required, Always Expanded */}
            <View style={[styles.unifiedSection, styles.firstSection]}>
              <View style={styles.unifiedSectionHeader}>
                <View style={styles.sectionHeaderIcon}>
                  <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.sectionHeaderContent}>
                  <View style={styles.sectionTitleRow}>
                    <Text variant="headingMedium" style={[styles.sectionHeaderTitle, { flexShrink: 1 }]}>
                      {t('activity.basicInfo')}
                    </Text>
                    <View style={styles.requiredBadge}>
                      <Text variant="caption" style={styles.requiredBadgeText}>
                        {t('common.required')}
                      </Text>
                    </View>
                  </View>
                  <Text variant="caption" color="textSecondary">
                    {t('activity.titleLabel')}
                  </Text>
                </View>
              </View>
              
              <View style={styles.section}>
                {/* Activity Type Selection */}
                <View style={styles.fieldLabelContainer}>
                  <Text variant="label" color="textSecondary" style={styles.fieldLabel}>
                    {t('activity.type')}
                  </Text>
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
                          // Clear street when switching to operation (privacy/security)
                          if (activityType === 'operation') {
                            setStreet('');
                          } else {
                            // Clear category when switching away from operation
                            setCategory('');
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={getTypeIcon(activityType) as any}
                          size={28}
                          color={isSelected ? '#FFFFFF' : typeColor}
                        />
                        <Text
                          variant="body"
                          style={{ 
                            color: isSelected ? '#FFFFFF' : theme.colors.textPrimary,
                            fontWeight: '600',
                            marginTop: theme.spacing.xxs,
                            fontSize: theme.typography.fontSize.sm,
                          }}
                        >
                          {typeLabel}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.fieldLabelContainer}>
                  <Text variant="label" color="textSecondary" style={styles.fieldLabel}>
                    {t('activity.titleLabel')}
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
                  
                  {type === 'operation' ? (
                    <Select
                      label={t('activity.category')}
                      value={category}
                      onValueChange={(value) => {
                        setCategory(value);
                      }}
                      options={operationCategoryOptions}
                      placeholder={t('activity.categoryPlaceholder')}
                    />
                  ) : (
                    <Input
                      label={t('activity.category')}
                      value={category}
                      onChangeText={(value) => {
                        setCategory(value);
                      }}
                      placeholder={t('activity.categoryPlaceholder')}
                    />
                  )}
                </>
              )}
              </View>
            </View>
            
            {/* Time & Duration - Required, Always Expanded */}
            <View style={styles.unifiedSection}>
              <View style={styles.unifiedSectionHeader}>
                <View style={styles.sectionHeaderIcon}>
                  <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.sectionHeaderContent}>
                  <View style={styles.sectionTitleRow}>
                    <Text variant="headingMedium" style={[styles.sectionHeaderTitle, { flexShrink: 1 }]}>
                      {type === 'operation' ? t('activity.alarmTime') : t('activity.timeAndDuration')}
                    </Text>
                    <View style={styles.requiredBadge}>
                      <Text variant="caption" style={styles.requiredBadgeText}>
                        {t('common.required')}
                      </Text>
                    </View>
                  </View>
                  <Text variant="caption" color="textSecondary">
                    {t('activity.date')}, {t('activity.time')} & {t('activity.duration')}
                  </Text>
                </View>
              </View>
              
              <View style={styles.section}>
              <View style={styles.fieldLabelContainer}>
                <Text variant="label" color="textSecondary" style={styles.fieldLabel}>
                  {type === 'operation' ? t('activity.alarmTime') : t('activity.date')}
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
                  {t('activity.duration')}
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
                    style={styles.durationInput}
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
              </View>
            </View>
            
            {/* Location (Optional) */}
            <View style={styles.unifiedSection}>
              <TouchableOpacity 
                style={styles.expandableHeader}
                onPress={() => toggleSection('location')}
                activeOpacity={0.7}
              >
                <View style={styles.sectionHeaderIcon}>
                  <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.sectionHeaderContent}>
                  <Text variant="headingMedium" style={styles.sectionHeaderTitle}>
                    {t('activity.location')}
                  </Text>
                </View>
                <Ionicons 
                  name={expandedSections.location ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={theme.colors.textSecondary} 
                />
              </TouchableOpacity>
              
              {expandedSections.location && (
                <View style={styles.section}>
                  <Input
                    label={t('activity.town')}
                    value={town}
                    onChangeText={setTown}
                    placeholder={t('activity.townPlaceholder')}
                  />
                  
                  {/* Only show street input if type is not "operation" */}
                  {type !== 'operation' && (
                    <>
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
                    </>
                  )}
                </View>
              )}
            </View>
            
            {/* Report (Optional) */}
            <View style={styles.unifiedSection}>
              <TouchableOpacity 
                style={styles.expandableHeader}
                onPress={() => toggleSection('report')}
                activeOpacity={0.7}
              >
                <View style={styles.sectionHeaderIcon}>
                  <Ionicons name="document-outline" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.sectionHeaderContent}>
                  <Text variant="headingMedium" style={styles.sectionHeaderTitle}>
                    {t('activity.report')}
                  </Text>
                  <Text variant="caption" color="textSecondary">
                    {t('activity.details')}
                  </Text>
                </View>
                <Ionicons 
                  name={expandedSections.report ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={theme.colors.textSecondary} 
                />
              </TouchableOpacity>
              
              {expandedSections.report && (
                <View style={styles.section}>
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
                </View>
              )}
            </View>
            
            {/* Visibility */}
            <View style={[styles.unifiedSection, styles.lastSection]}>
              <TouchableOpacity 
                style={styles.expandableHeader}
                onPress={() => toggleSection('visibility')}
                activeOpacity={0.7}
              >
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
                <Ionicons 
                  name={expandedSections.visibility ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={theme.colors.textSecondary} 
                />
              </TouchableOpacity>
              
              {expandedSections.visibility && (
                <View style={styles.section}>
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
                            size={24}
                            color={visibility === option.value ? theme.colors.primary : theme.colors.textSecondary}
                          />
                          <Text
                            variant="body"
                            style={{
                              marginTop: theme.spacing.xxs,
                              color: visibility === option.value ? theme.colors.primary : theme.colors.textPrimary,
                              fontWeight: visibility === option.value ? '600' : '500',
                              fontSize: theme.typography.fontSize.sm,
                            }}
                          >
                            {option.label}
                          </Text>
                          <Text
                            variant="caption"
                            style={{
                              marginTop: 2,
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
                </View>
              )}
            </View>
            </View>

            {/* Reset and Save Buttons */}
            <View style={styles.saveButtonContainer} pointerEvents="box-none">
              {/* Reset Button */}
              <Button
                variant="secondary"
                onPress={resetForm}
                style={styles.resetButton}
                disabled={loading}
              >
                <View style={styles.buttonContent}>
                  <Ionicons name="refresh-outline" size={20} color={theme.colors.textPrimary} />
                  <Text variant="body" style={[styles.buttonText, { color: theme.colors.textPrimary, marginLeft: theme.spacing.sm }]}>
                    {t('common.reset')}
                  </Text>
                </View>
              </Button>
              
              {/* Save Button */}
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
      paddingHorizontal: theme.spacing.md, // Horizontal padding for content
      paddingTop: theme.spacing.md,
      paddingBottom: 0, // Bottom padding handled by contentContainerStyle
    },
    unifiedFormContainer: {
      backgroundColor: theme.colors.glassBackground,
      borderRadius: theme.borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
      overflow: 'hidden',
      marginTop: theme.spacing.lg,
    },
    unifiedSection: {
      backgroundColor: 'transparent',
      padding: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    firstSection: {
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
    },
    lastSection: {
      borderBottomWidth: 0,
      borderBottomLeftRadius: theme.borderRadius.xl,
      borderBottomRightRadius: theme.borderRadius.xl,
    },
    expandableCard: {
      marginBottom: theme.spacing.md, // Spacing between cards
    },
    firstSectionHeader: {
      marginTop: theme.spacing.lg, // Less margin for first section
    },
    expandableHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    unifiedSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xxl, // Increased for better section separation
      marginBottom: theme.spacing.lg, // Increased to separate from section content
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      paddingBottom: theme.spacing.md + theme.spacing.xs, // Extra padding for border
      borderBottomWidth: 2, // Thicker border for better separation
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.backgroundSecondary, // Subtle background to make header stand out
      borderRadius: theme.borderRadius.md,
      marginHorizontal: -theme.spacing.md, // Extend to edges for better visual separation
    },
    sectionHeaderIcon: {
      width: 28, // Reduced from 32
      height: 28, // Reduced from 32
      borderRadius: 14,
      backgroundColor: `${theme.colors.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    sectionHeaderContent: {
      flex: 1,
    },
    sectionHeaderTitle: {
      marginBottom: 1,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: 2,
      flexWrap: 'wrap',
    },
    requiredBadge: {
      backgroundColor: theme.colors.error,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xxs,
      borderRadius: theme.borderRadius.sm,
      flexShrink: 0,
    },
    requiredBadgeText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: theme.typography.fontSize.xs,
    },
    optionalBadge: {
      backgroundColor: theme.colors.textTertiary,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xxs,
      borderRadius: theme.borderRadius.sm,
    },
    optionalBadgeText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: theme.typography.fontSize.xs,
    },
    typeSelector: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    typeButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.md, // Reduced from lg
      borderRadius: theme.borderRadius.lg, // Reduced from xl
      borderWidth: 2,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      minHeight: 80, // Reduced from 100, still meets 44px touch target
    },
    section: {
      paddingTop: theme.spacing.md,
      gap: theme.spacing.sm, // Keep compact but readable
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: theme.spacing.sm, // Reduced from md
    },
    required: {
      color: theme.colors.error,
      fontWeight: '700',
    },
    fieldLabel: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: '600',
      marginBottom: theme.spacing.xs, // Reduced from sm
    },
    fieldLabelContainer: {
      marginBottom: theme.spacing.xxs, // Reduced from xs
    },
    dateTimeRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm, // Reduced from md
    },
    dateTimeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs, // Reduced from sm
      paddingVertical: theme.spacing.sm, // Reduced from md
      paddingHorizontal: theme.spacing.sm, // Reduced from md
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      minHeight: 44, // Ensure touch target meets accessibility standards
    },
    durationRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm, // Reduced from md
      alignItems: 'stretch', // Changed from flex-start to stretch for equal heights
    },
    durationInputWrapper: {
      flex: 1,
    },
    durationInput: {
      height: 44, // Fixed height to match unit buttons exactly
      marginBottom: 0, // Remove default margin from Input component
    },
    durationUnitWrapper: {
      flex: 1,
    },
    unitButtons: {
      flexDirection: 'row',
      gap: theme.spacing.xxs, // Reduced from xs
      backgroundColor: theme.colors.surface, // Changed to match input background
      borderRadius: theme.borderRadius.md, // Match input border radius
      padding: 0, // Remove padding to match input exactly
      borderWidth: 1, // Add border to match input
      borderColor: theme.colors.border, // Match input border color
      height: 44, // Fixed height to match input exactly
      alignItems: 'stretch', // Ensure buttons stretch to container height
    },
    unitButton: {
      flex: 1,
      paddingVertical: theme.spacing.sm, // Match input paddingVertical (8px)
      borderRadius: theme.borderRadius.sm, // Reduced from md
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
      gap: theme.spacing.sm, // Reduced from md
    },
    visibilityOption: {
      flex: 1,
    },
    visibilityOptionContent: {
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingVertical: theme.spacing.md, // Reduced from lg
      paddingHorizontal: theme.spacing.xs, // Reduced from sm
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      minHeight: 100, // Reduced from fixed 120, using minHeight for flexibility
      width: '100%',
    },
    saveButtonContainer: {
      marginTop: theme.spacing.xxl, // Increased for better separation from last section
      marginBottom: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    resetButton: {
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      minHeight: 52, // Standard button height for better touch target
    },
    saveButton: {
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      minHeight: 52, // Standard button height for better touch target
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
      alignItems: 'center', // Changed from flex-start for better alignment
      paddingVertical: theme.spacing.xxs, // Reduced from xs
      minHeight: 44, // Ensure touch target
    },
    switchLabel: {
      flexDirection: 'row',
      alignItems: 'center', // Changed from flex-start
      gap: theme.spacing.xs, // Reduced from sm
      flex: 1,
    },
    switchTextContainer: {
      flex: 1,
    },
    switchHint: {
      marginTop: 2, // Reduced from xxs spacing
    },
    infoBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.xs, // Reduced from sm
      padding: theme.spacing.sm, // Reduced from md
      backgroundColor: `${theme.colors.info}15`,
      borderRadius: theme.borderRadius.md,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.info,
      marginTop: theme.spacing.xs,
    },
    infoText: {
      flex: 1,
      lineHeight: 18,
    },
    textArea: {
      minHeight: 100, // Reduced from 120
      paddingTop: theme.spacing.sm, // Reduced from md
    },
    reportTextInput: {
      minHeight: 100, // Reduced from 120
      paddingTop: theme.spacing.sm, // Reduced from md
      paddingHorizontal: theme.spacing.sm, // Reduced from md
      paddingVertical: theme.spacing.xs, // Reduced from sm
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.regular,
      marginBottom: theme.spacing.sm, // Unified spacing
    },
    characterCount: {
      alignItems: 'flex-end',
      marginTop: theme.spacing.xxs, // Reduced from xs
    },
    fieldHint: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.xxs, // Reduced from xs
      marginTop: theme.spacing.xxs, // Reduced from xs
    },
    hintText: {
      flex: 1,
      lineHeight: 18,
    },
  });
}
