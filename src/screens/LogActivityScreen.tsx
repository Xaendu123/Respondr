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
import { ActivityIndicator, Alert, Keyboard, LayoutAnimation, Platform, StatusBar, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedAvatar, Button, Input, Select, Text, type SelectOption } from '../components/ui';
import { useActivities } from '../hooks/useActivities';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import { useToast } from '../providers/ToastProvider';
import { Activity, ActivityType, ActivityVisibility } from '../types';
import { hapticSelect, hapticSuccess } from '../utils/haptics';

type DurationUnit = 'minutes' | 'hours' | 'days';

export function LogActivityScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
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
  
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ActivityType>('exercise');
  const [falseAlarm, setFalseAlarm] = useState(false);
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [durationValue, setDurationValue] = useState('');
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('hours');
  const [situation, setSituation] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [town, setTown] = useState('');
  const [street, setStreet] = useState('');
  const [visibility, setVisibility] = useState<ActivityVisibility>('public');
  
  // Validation errors
  const [titleError, setTitleError] = useState('');
  const [durationError, setDurationError] = useState('');
  
  // Expandable sections state - all optional sections collapsed by default for cleaner UI
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    location: false,
    situation: false,
    lessonsLearned: false,
    visibility: false,
  });
  
  // Reset form and form mode
  const resetForm = useCallback(() => {
    // Reset all form fields
    setTitle('');
    setType('exercise');
    setFalseAlarm(false);
    setCategory('');
    setDate(new Date());
    setDurationValue('');
    setDurationUnit('hours');
    setSituation('');
    setLessonsLearned('');
    setTown('');
    setStreet('');
    setVisibility('public');
    setTitleError('');
    setDurationError('');
    
    setExpandedSections({
      location: false,
      situation: false,
      lessonsLearned: false,
      visibility: false,
    });
    
    // Reset form mode and selectedActivity (same pattern as formMode)
    setFormMode('new');
    setSelectedActivity(null);
    
    // Clear route params - wrap in try-catch to handle navigation errors
    try {
      router.setParams({
        activityId: '',
        formMode: '',
        activityData: '',
      });
    } catch (error) {
      // Router might not be ready yet, ignore the error
      // The params will be cleared on next navigation anyway
    }
  }, [router]);
  
  // Reset form when leaving the screen
  useFocusEffect(
    useCallback(() => {
      // Cleanup function runs when screen loses focus
      return () => {
        // Use setTimeout to ensure router is ready
        setTimeout(() => {
          resetForm();
        }, 0);
      };
    }, [resetForm])
  );
  
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
    // Exit early if not in edit mode
    if (formMode !== 'edit') {
      return;
    }
    
    // Use selectedActivity directly - it's state just like formMode
    if (!selectedActivity) {
      return;
    }
    
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
    
    setSituation(selectedActivity.situation || '');
    setLessonsLearned(selectedActivity.lessonsLearned || '');
    setVisibility(selectedActivity.visibility);
    setCategory(selectedActivity.category?.trim() || '');
    setFalseAlarm(selectedActivity.falseAlarm || false);
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
      showToast({ type: 'error', message: t('errors.notAuthenticated') });
      return;
    }

    if (formMode === 'edit' && !activityId) {
      showToast({ type: 'error', message: t('activity.editError') });
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
          situation: situation.trim() || undefined,
          lessonsLearned: lessonsLearned.trim() || undefined,
          duration: durationInMinutes,
          date,
          location,
          visibility,
          category: type === 'operation' ? category : undefined,
          falseAlarm: type === 'operation' ? falseAlarm : undefined,
        });
        
        hapticSuccess();
        showToast({ type: 'success', message: t('activity.updateSuccess') });
        // Navigate back to logbook after short delay
        setTimeout(() => {
          router.replace('/(tabs)/logbook');
        }, 500);
      } else {
        // Create new activity
        await createActivity({
          type,
          title,
          situation: situation.trim() || undefined,
          lessonsLearned: lessonsLearned.trim() || undefined,
          duration: durationInMinutes,
          date,
          location,
          unitId: user.unitId,
          visibility,
          category: type === 'operation' ? category : undefined,
          falseAlarm: type === 'operation' ? falseAlarm : undefined,
        });
        
        hapticSuccess();
        showToast({ type: 'success', message: t('activity.saveSuccess') });
        // Reset form and navigate to logbook after short delay
        setTimeout(() => {
          resetForm();
          router.push('/(tabs)/logbook');
        }, 500);
      }
    } catch (error) {
      console.error('Failed to save activity:', error);
      showToast({ type: 'error', message: formMode === 'edit' ? t('activity.updateError') : t('activity.saveError') });
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
          <Text variant="headingLarge" style={{ color: '#FFFFFF' }}>
            {formMode === 'edit' ? t('activity.edit') : t('activity.logNew')}
          </Text>
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
      
      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            flexGrow: 1,
            paddingBottom: theme.spacing.lg + insets.bottom + 100
          }
        ]}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        enableResetScrollToCoords={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        extraScrollHeight={Platform.OS === 'ios' ? 150 : 100}
        extraHeight={Platform.OS === 'ios' ? 180 : 120}
        keyboardOpeningTime={0}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={true}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => Keyboard.dismiss()}
      >
            {/* Simplified Form Container */}
            <View style={styles.unifiedFormContainer}>

            {/* Activity Type Selection - Compact */}
            <View style={[styles.unifiedSection, styles.firstSection]}>
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
                      onPress={() => {
                        hapticSelect();
                        setType(activityType);
                        if (activityType === 'operation') {
                          setStreet('');
                        } else {
                          setCategory('');
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={getTypeIcon(activityType) as any}
                        size={22}
                        color={isSelected ? '#FFFFFF' : typeColor}
                      />
                      <Text
                        variant="caption"
                        style={{
                          color: isSelected ? '#FFFFFF' : theme.colors.textPrimary,
                          fontWeight: '600',
                          marginTop: 4,
                        }}
                      >
                        {typeLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Title - Required */}
            <View style={styles.unifiedSection}>
              <Input
                label={t('activity.titleLabel')}
                value={title}
                onChangeText={handleTitleChange}
                placeholder={t('activity.titlePlaceholder')}
                error={titleError}
                autoFocus={false}
              />

              {/* Operation-specific: False Alarm & Category */}
              {type === 'operation' && (
                <>
                  <View style={styles.switchRow}>
                    <View style={styles.switchLabel}>
                      <Ionicons name="alert-circle-outline" size={18} color={theme.colors.textSecondary} />
                      <Text variant="body" style={{ marginLeft: 8 }}>{t('activity.falseAlarm')}</Text>
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

                  <Select
                    label={t('activity.category')}
                    value={category}
                    onValueChange={setCategory}
                    options={operationCategoryOptions}
                    placeholder={t('activity.categoryPlaceholder')}
                  />
                </>
              )}
            </View>

            {/* Date, Time & Duration - Compact Row */}
            <View style={styles.unifiedSection}>
              <View style={styles.dateTimeRow}>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => {
                    hapticSelect();
                    setShowDatePicker(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
                  <Text variant="body" style={{ marginLeft: 6 }}>
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
                  <Ionicons name="time-outline" size={18} color={theme.colors.primary} />
                  <Text variant="body" style={{ marginLeft: 6 }}>
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
                    if (selectedDate) setDate(selectedDate);
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
                    if (selectedDate) setDate(selectedDate);
                  }}
                />
              )}

              <View style={styles.durationRow}>
                <View style={styles.durationInputWrapper}>
                  <Input
                    label={t('activity.duration')}
                    value={durationValue}
                    onChangeText={handleDurationChange}
                    placeholder="2"
                    keyboardType="numeric"
                    error={durationError}
                  />
                </View>
                <View style={styles.durationUnitWrapper}>
                  <Text variant="label" color="textSecondary" style={{ marginBottom: 8 }}> </Text>
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
            
            {/* Optional Fields Section */}
            <View style={styles.optionalSection}>
              <Text variant="label" color="textSecondary" style={styles.optionalLabel}>
                {t('common.optional')}
              </Text>

              {/* Location */}
              <TouchableOpacity
                style={styles.optionalRow}
                onPress={() => toggleSection('location')}
                activeOpacity={0.7}
              >
                <Ionicons name="location-outline" size={20} color={theme.colors.textSecondary} />
                <Text variant="body" style={styles.optionalRowText}>{t('activity.location')}</Text>
                {(town || street) && (
                  <Text variant="caption" color="textTertiary" numberOfLines={1} style={styles.optionalPreview}>
                    {[street, town].filter(Boolean).join(', ')}
                  </Text>
                )}
                <Ionicons
                  name={expandedSections.location ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={theme.colors.textTertiary}
                />
              </TouchableOpacity>
              {expandedSections.location && (
                <View style={styles.optionalContent}>
                  <Input
                    value={town}
                    onChangeText={setTown}
                    placeholder={t('activity.townPlaceholder')}
                  />
                  {type !== 'operation' && (
                    <Input
                      value={street}
                      onChangeText={setStreet}
                      placeholder={t('activity.streetPlaceholder')}
                    />
                  )}
                </View>
              )}

              {/* Situation */}
              <TouchableOpacity
                style={styles.optionalRow}
                onPress={() => toggleSection('situation')}
                activeOpacity={0.7}
              >
                <Ionicons name="document-text-outline" size={20} color={theme.colors.textSecondary} />
                <Text variant="body" style={styles.optionalRowText}>{t('activity.situation')}</Text>
                {situation && (
                  <Text variant="caption" color="textTertiary" numberOfLines={1} style={styles.optionalPreview}>
                    {situation.substring(0, 30)}...
                  </Text>
                )}
                <Ionicons
                  name={expandedSections.situation ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={theme.colors.textTertiary}
                />
              </TouchableOpacity>
              {expandedSections.situation && (
                <View style={styles.optionalContent}>
                  <TextInput
                    value={situation}
                    onChangeText={setSituation}
                    placeholder={t('activity.situationPlaceholder')}
                    placeholderTextColor={theme.colors.textTertiary}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    style={[styles.textArea, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
                  />
                </View>
              )}

              {/* Lessons Learned */}
              <TouchableOpacity
                style={styles.optionalRow}
                onPress={() => toggleSection('lessonsLearned')}
                activeOpacity={0.7}
              >
                <Ionicons name="bulb-outline" size={20} color={theme.colors.textSecondary} />
                <Text variant="body" style={styles.optionalRowText}>{t('activity.lessonsLearned')}</Text>
                {lessonsLearned && (
                  <Text variant="caption" color="textTertiary" numberOfLines={1} style={styles.optionalPreview}>
                    {lessonsLearned.substring(0, 30)}...
                  </Text>
                )}
                <Ionicons
                  name={expandedSections.lessonsLearned ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={theme.colors.textTertiary}
                />
              </TouchableOpacity>
              {expandedSections.lessonsLearned && (
                <View style={styles.optionalContent}>
                  <TextInput
                    value={lessonsLearned}
                    onChangeText={setLessonsLearned}
                    placeholder={t('activity.lessonsLearnedPlaceholder')}
                    placeholderTextColor={theme.colors.textTertiary}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    style={[styles.textArea, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
                  />
                </View>
              )}

              {/* Visibility */}
              <TouchableOpacity
                style={[styles.optionalRow, styles.lastOptionalRow]}
                onPress={() => toggleSection('visibility')}
                activeOpacity={0.7}
              >
                <Ionicons name="eye-outline" size={20} color={theme.colors.textSecondary} />
                <Text variant="body" style={styles.optionalRowText}>{t('activity.visibility')}</Text>
                <Text variant="caption" color="primary" style={styles.optionalPreview}>
                  {visibility === 'public' ? t('activity.visibilityPublic') :
                   visibility === 'unit' ? t('activity.visibilityUnit') : t('activity.visibilityPrivate')}
                </Text>
                <Ionicons
                  name={expandedSections.visibility ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={theme.colors.textTertiary}
                />
              </TouchableOpacity>
              {expandedSections.visibility && (
                <View style={styles.optionalContent}>
                  <View style={styles.visibilityOptions}>
                    {[
                      { value: 'public' as ActivityVisibility, label: t('activity.visibilityPublic'), icon: 'earth' },
                      { value: 'unit' as ActivityVisibility, label: t('activity.visibilityUnit'), icon: 'people' },
                      { value: 'private' as ActivityVisibility, label: t('activity.visibilityPrivate'), icon: 'lock-closed' },
                    ].map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.visibilityChip,
                          visibility === option.value && styles.visibilityChipActive,
                        ]}
                        onPress={() => {
                          hapticSelect();
                          setVisibility(option.value);
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={option.icon as any}
                          size={16}
                          color={visibility === option.value ? '#FFFFFF' : theme.colors.textSecondary}
                        />
                        <Text
                          variant="caption"
                          style={{
                            marginLeft: 6,
                            color: visibility === option.value ? '#FFFFFF' : theme.colors.textPrimary,
                            fontWeight: '600',
                          }}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
            </View>

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
      justifyContent: 'space-between',
    },
    profileButton: {
      borderRadius: 18,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.sm,
    },
    unifiedFormContainer: {
      backgroundColor: theme.colors.glassBackground,
      borderRadius: theme.borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
      overflow: 'hidden',
    },
    unifiedSection: {
      backgroundColor: 'transparent',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    firstSection: {
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
    },
    typeSelector: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    typeButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      borderWidth: 2,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      minHeight: 60,
    },
    dateTimeRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    dateTimeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      minHeight: 44,
    },
    durationRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
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
      gap: 2,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      height: 44,
      overflow: 'hidden',
    },
    unitButton: {
      flex: 1,
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
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    switchLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    // Optional fields section
    optionalSection: {
      marginTop: theme.spacing.lg,
    },
    optionalLabel: {
      marginBottom: theme.spacing.sm,
      marginLeft: theme.spacing.xs,
    },
    optionalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.glassBackground,
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
      borderBottomWidth: 0,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
    },
    lastOptionalRow: {
      borderBottomWidth: 1,
      borderBottomLeftRadius: theme.borderRadius.lg,
      borderBottomRightRadius: theme.borderRadius.lg,
    },
    optionalRowText: {
      flex: 1,
      marginLeft: theme.spacing.sm,
    },
    optionalPreview: {
      maxWidth: '40%',
      marginRight: theme.spacing.sm,
    },
    optionalContent: {
      backgroundColor: theme.colors.surface,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: theme.colors.glassBorder,
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    textArea: {
      minHeight: 80,
      padding: theme.spacing.sm,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.regular,
      textAlignVertical: 'top',
    },
    visibilityOptions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    visibilityChip: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    visibilityChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    saveButtonContainer: {
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.md,
    },
    saveButton: {
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      minHeight: 52,
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
  });
}
