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
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, LayoutAnimation, Platform, ScrollView, StatusBar, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedAvatar, Button, Input, Select, SuccessAnimation, Text, type SelectOption } from '../components/ui';
import { getActivityTypeColor, getActivityTypeIcon } from '../constants/activityTypes';
import { useActivities } from '../hooks/useActivities';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import { useToast } from '../providers/ToastProvider';
import { Activity, ActivityType, ActivityVisibility } from '../types';
import { getGreeting } from '../utils/greetings';
import { hapticSelect, hapticSuccess } from '../utils/haptics';

type DurationUnit = 'minutes' | 'hours' | 'days';

export function LogActivityScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const params = useLocalSearchParams<{
    activityId?: string;
    formMode?: 'new' | 'edit';
    activityData?: string;
    _ts?: string;
  }>();

  const initialFormMode = params.formMode || (params.activityId ? 'edit' : 'new');
  const [formMode, setFormMode] = useState<'new' | 'edit'>(initialFormMode);

  const parseActivityDataFromParams = (): Activity | null => {
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

  const initialActivityData = parseActivityDataFromParams();
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(initialActivityData);

  useEffect(() => {
    const activityData = parseActivityDataFromParams();
    const newFormMode = (params.formMode === 'edit' && activityData) ? 'edit' : 'new';
    setFormMode(newFormMode);
    setSelectedActivity(activityData ? { ...activityData } : null);
  }, [params.formMode, params.activityData, params._ts]);

  const activityId = params.activityId || selectedActivity?.id;

  const { createActivity, updateActivity, loading } = useActivities(formMode === 'edit' ? 'mine' : 'all');
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

  const [titleError, setTitleError] = useState('');
  const [durationError, setDurationError] = useState('');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    location: false,
    situation: false,
    lessonsLearned: false,
    visibility: false,
  });

  // Track keyboard state for scroll adjustment
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const resetForm = useCallback(() => {
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

    setFormMode('new');
    setSelectedActivity(null);

    try {
      router.setParams({
        activityId: '',
        formMode: '',
        activityData: '',
      });
    } catch (error) {
      // Router might not be ready yet
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      return () => {
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

    // Scroll to make expanded section visible after a short delay
    if (!expandedSections[sectionKey]) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [expandedSections]);

  // Handle multiline input focus - scroll to make it visible
  const handleTextAreaFocus = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
  }, []);

  const styles = createStyles(theme);

  const durationUnitOptions: SelectOption[] = [
    { label: t('activity.unitMinutes'), value: 'minutes' },
    { label: t('activity.unitHours'), value: 'hours' },
    { label: t('activity.unitDays'), value: 'days' },
  ];

  const operationCategoryOptions: SelectOption[] = [
    { label: t('activity.noCategory'), value: '' },
    { label: t('activity.categoryA1'), value: 'A1 - Brand klein' },
    { label: t('activity.categoryA2'), value: 'A2 - Brand mittel' },
    { label: t('activity.categoryA3'), value: 'A3 - Brand gross' },
    { label: t('activity.categoryB1'), value: 'B1 - Elementar klein' },
    { label: t('activity.categoryB2'), value: 'B2 - Elementar mittel' },
    { label: t('activity.categoryB3'), value: 'B3 - Elementar gross' },
    { label: t('activity.categoryC1'), value: 'C1 - Hilfeleistung klein' },
    { label: t('activity.categoryC2'), value: 'C2 - Hilfeleistung mittel' },
    { label: t('activity.categoryC3'), value: 'C3 - Hilfeleistung gross' },
    { label: t('activity.categoryD1'), value: 'D1 - Öl/Benzin/Gas klein' },
    { label: t('activity.categoryD2'), value: 'D2 - Öl/Benzin/Gas mittel' },
    { label: t('activity.categoryD3'), value: 'D3 - Öl/Benzin/Gas gross' },
    { label: t('activity.categoryE1'), value: 'E1 - ABC klein' },
    { label: t('activity.categoryE2'), value: 'E2 - ABC mittel' },
    { label: t('activity.categoryE3'), value: 'E3 - ABC gross' },
    { label: t('activity.categoryF1'), value: 'F1 - PbU klein' },
    { label: t('activity.categoryF2'), value: 'F2 - PbU mittel' },
    { label: t('activity.categoryF3'), value: 'F3 - PbU gross' },
    { label: t('activity.categoryG1'), value: 'G1 - Tierrettung klein' },
    { label: t('activity.categoryG2'), value: 'G2 - Tierrettung mittel' },
  ];

  const isFormValid = title.trim().length > 0 &&
    durationValue.trim().length > 0 &&
    !isNaN(Number(durationValue)) &&
    Number(durationValue) > 0;

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

  const convertDurationFromMinutes = (minutes: number): { value: number; unit: DurationUnit } => {
    if (minutes >= 1440) {
      return { value: Math.round((minutes / 1440) * 10) / 10, unit: 'days' };
    } else if (minutes >= 60) {
      return { value: Math.round((minutes / 60) * 10) / 10, unit: 'hours' };
    } else {
      return { value: minutes, unit: 'minutes' };
    }
  };

  useEffect(() => {
    if (formMode !== 'edit') {
      return;
    }

    if (!selectedActivity) {
      return;
    }

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
  }, [formMode, selectedActivity, activityId, params.activityData]);

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
      const locationParts = type === 'operation'
        ? [town].filter(Boolean)
        : [street, town].filter(Boolean);
      const location = locationParts.join(', ') || undefined;

      if (formMode === 'edit' && activityId) {
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
        setTimeout(() => {
          router.replace('/(tabs)/logbook');
        }, 500);
      } else {
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
        // Show success animation for new activities
        setShowSuccessAnimation(true);
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

  const getVisibilityIcon = (vis: ActivityVisibility) => {
    switch (vis) {
      case 'public': return 'earth';
      case 'unit': return 'people';
      case 'private': return 'lock-closed';
    }
  };

  // Handle success animation completion
  const handleSuccessAnimationComplete = useCallback(() => {
    setShowSuccessAnimation(false);
    resetForm();
    router.push('/(tabs)/logbook');
  }, [resetForm, router]);

  // Get shift-aware greeting
  const greeting = getGreeting();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.gradientStart} translucent={true} />

      {/* Success Animation Overlay */}
      <SuccessAnimation
        visible={showSuccessAnimation}
        onAnimationComplete={handleSuccessAnimationComplete}
        message={t('success.activityLogged')}
        subtitle={t('success.keepItUp')}
      />

      {/* Header with Gradient */}
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerContent}>
          <View>
            {formMode === 'new' && (
              <Text variant="caption" style={styles.greetingText}>
                {t(greeting.key)}, {user?.firstName || user?.displayName}
              </Text>
            )}
            <Text variant="headingLarge" style={{ color: '#FFFFFF' }}>
              {formMode === 'edit' ? t('activity.edit') : t('activity.logNew')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
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

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: keyboardVisible ? 350 : insets.bottom + 120 }
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        {/* Activity Type Selection */}
        <View style={styles.typeContainer}>
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
                  isSelected && { backgroundColor: typeColor, borderColor: typeColor }
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
                  size={24}
                  color={isSelected ? '#FFFFFF' : typeColor}
                />
                <Text
                  variant="caption"
                  style={[
                    styles.typeButtonText,
                    { color: isSelected ? '#FFFFFF' : theme.colors.textPrimary }
                  ]}
                >
                  {typeLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Main Form Card */}
        <View style={styles.card}>
          {/* Title Input */}
          <View style={styles.inputGroup}>
            <Text variant="label" color="textSecondary" style={styles.inputLabel}>
              {t('activity.titleLabel')} *
            </Text>
            <TextInput
              value={title}
              onChangeText={handleTitleChange}
              placeholder={t('activity.titlePlaceholder')}
              placeholderTextColor={theme.colors.textTertiary}
              style={[
                styles.textInput,
                titleError ? styles.textInputError : null
              ]}
            />
            {titleError ? (
              <Text variant="caption" style={styles.errorText}>{titleError}</Text>
            ) : null}
          </View>

          {/* Operation-specific fields */}
          {type === 'operation' && (
            <>
              <View style={styles.switchContainer}>
                <View style={styles.switchInfo}>
                  <Ionicons name="alert-circle" size={20} color={theme.colors.warning} />
                  <Text variant="body" style={styles.switchLabel}>{t('activity.falseAlarm')}</Text>
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

              <View style={styles.inputGroup}>
                <Select
                  label={t('activity.category')}
                  value={category}
                  onValueChange={setCategory}
                  options={operationCategoryOptions}
                  placeholder={t('activity.categoryPlaceholder')}
                />
              </View>
            </>
          )}

          {/* Date & Time Row */}
          <View style={styles.rowContainer}>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => {
                hapticSelect();
                setShowDatePicker(true);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar" size={20} color={theme.colors.primary} />
              <Text variant="body" style={styles.dateTimeText}>
                {date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
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
              <Ionicons name="time" size={20} color={theme.colors.primary} />
              <Text variant="body" style={styles.dateTimeText}>
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

          {/* Duration */}
          <View style={styles.inputGroup}>
            <Text variant="label" color="textSecondary" style={styles.inputLabel}>
              {t('activity.duration')} *
            </Text>
            <View style={styles.durationContainer}>
              <TextInput
                value={durationValue}
                onChangeText={handleDurationChange}
                placeholder="2"
                placeholderTextColor={theme.colors.textTertiary}
                keyboardType="numeric"
                style={[
                  styles.durationInput,
                  durationError ? styles.textInputError : null
                ]}
              />
              <View style={styles.unitSelector}>
                {durationUnitOptions.map((unit) => (
                  <TouchableOpacity
                    key={unit.value}
                    style={[
                      styles.unitButton,
                      durationUnit === unit.value && styles.unitButtonActive
                    ]}
                    onPress={() => {
                      hapticSelect();
                      setDurationUnit(unit.value as DurationUnit);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      variant="caption"
                      style={[
                        styles.unitButtonText,
                        { color: durationUnit === unit.value ? '#FFFFFF' : theme.colors.textSecondary }
                      ]}
                    >
                      {unit.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {durationError ? (
              <Text variant="caption" style={styles.errorText}>{durationError}</Text>
            ) : null}
          </View>
        </View>

        {/* Optional Fields Section */}
        <Text variant="label" color="textSecondary" style={styles.sectionTitle}>
          {t('common.optional')}
        </Text>

        {/* Location Card */}
        <View style={styles.expandableCard}>
          <TouchableOpacity
            style={styles.expandableHeader}
            onPress={() => toggleSection('location')}
            activeOpacity={0.7}
          >
            <View style={styles.expandableHeaderLeft}>
              <View style={[styles.iconCircle, { backgroundColor: theme.colors.info + '20' }]}>
                <Ionicons name="location" size={18} color={theme.colors.info} />
              </View>
              <View style={styles.expandableHeaderText}>
                <Text variant="body" style={styles.expandableTitle}>{t('activity.location')}</Text>
                {(town || street) && !expandedSections.location && (
                  <Text variant="caption" color="textSecondary" numberOfLines={1}>
                    {[street, town].filter(Boolean).join(', ')}
                  </Text>
                )}
              </View>
            </View>
            <Ionicons
              name={expandedSections.location ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.colors.textTertiary}
            />
          </TouchableOpacity>
          {expandedSections.location && (
            <View style={styles.expandableContent}>
              <View style={styles.inputGroup}>
                <Text variant="caption" color="textSecondary" style={styles.expandedInputLabel}>
                  {t('activity.townPlaceholder')}
                </Text>
                <TextInput
                  value={town}
                  onChangeText={setTown}
                  placeholder={t('activity.townPlaceholder')}
                  placeholderTextColor={theme.colors.textTertiary}
                  style={styles.textInput}
                />
              </View>
              {type !== 'operation' && (
                <View style={styles.inputGroup}>
                  <Text variant="caption" color="textSecondary" style={styles.expandedInputLabel}>
                    {t('activity.streetPlaceholder')}
                  </Text>
                  <TextInput
                    value={street}
                    onChangeText={setStreet}
                    placeholder={t('activity.streetPlaceholder')}
                    placeholderTextColor={theme.colors.textTertiary}
                    style={styles.textInput}
                  />
                </View>
              )}
            </View>
          )}
        </View>

        {/* Situation Card */}
        <View style={styles.expandableCard}>
          <TouchableOpacity
            style={styles.expandableHeader}
            onPress={() => toggleSection('situation')}
            activeOpacity={0.7}
          >
            <View style={styles.expandableHeaderLeft}>
              <View style={[styles.iconCircle, { backgroundColor: theme.colors.warning + '20' }]}>
                <Ionicons name="document-text" size={18} color={theme.colors.warning} />
              </View>
              <View style={styles.expandableHeaderText}>
                <Text variant="body" style={styles.expandableTitle}>{t('activity.situation')}</Text>
                {situation && !expandedSections.situation && (
                  <Text variant="caption" color="textSecondary" numberOfLines={1}>
                    {situation.substring(0, 40)}{situation.length > 40 ? '...' : ''}
                  </Text>
                )}
              </View>
            </View>
            <Ionicons
              name={expandedSections.situation ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.colors.textTertiary}
            />
          </TouchableOpacity>
          {expandedSections.situation && (
            <View style={styles.expandableContent}>
              <TextInput
                value={situation}
                onChangeText={setSituation}
                placeholder={t('activity.situationPlaceholder')}
                placeholderTextColor={theme.colors.textTertiary}
                multiline
                textAlignVertical="top"
                onFocus={handleTextAreaFocus}
                style={styles.textArea}
              />
            </View>
          )}
        </View>

        {/* Lessons Learned Card */}
        <View style={styles.expandableCard}>
          <TouchableOpacity
            style={styles.expandableHeader}
            onPress={() => toggleSection('lessonsLearned')}
            activeOpacity={0.7}
          >
            <View style={styles.expandableHeaderLeft}>
              <View style={[styles.iconCircle, { backgroundColor: theme.colors.success + '20' }]}>
                <Ionicons name="bulb" size={18} color={theme.colors.success} />
              </View>
              <View style={styles.expandableHeaderText}>
                <Text variant="body" style={styles.expandableTitle}>{t('activity.lessonsLearned')}</Text>
                {lessonsLearned && !expandedSections.lessonsLearned && (
                  <Text variant="caption" color="textSecondary" numberOfLines={1}>
                    {lessonsLearned.substring(0, 40)}{lessonsLearned.length > 40 ? '...' : ''}
                  </Text>
                )}
              </View>
            </View>
            <Ionicons
              name={expandedSections.lessonsLearned ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.colors.textTertiary}
            />
          </TouchableOpacity>
          {expandedSections.lessonsLearned && (
            <View style={styles.expandableContent}>
              <TextInput
                value={lessonsLearned}
                onChangeText={setLessonsLearned}
                placeholder={t('activity.lessonsLearnedPlaceholder')}
                placeholderTextColor={theme.colors.textTertiary}
                multiline
                textAlignVertical="top"
                onFocus={handleTextAreaFocus}
                style={styles.textArea}
              />
            </View>
          )}
        </View>

        {/* Visibility Card */}
        <View style={styles.expandableCard}>
          <TouchableOpacity
            style={styles.expandableHeader}
            onPress={() => toggleSection('visibility')}
            activeOpacity={0.7}
          >
            <View style={styles.expandableHeaderLeft}>
              <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '20' }]}>
                <Ionicons name={getVisibilityIcon(visibility)} size={18} color={theme.colors.primary} />
              </View>
              <View style={styles.expandableHeaderText}>
                <Text variant="body" style={styles.expandableTitle}>{t('activity.visibility')}</Text>
                <Text variant="caption" color="primary">
                  {visibility === 'public' ? t('activity.visibilityPublic') :
                   visibility === 'unit' ? t('activity.visibilityUnit') : t('activity.visibilityPrivate')}
                </Text>
              </View>
            </View>
            <Ionicons
              name={expandedSections.visibility ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.colors.textTertiary}
            />
          </TouchableOpacity>
          {expandedSections.visibility && (
            <View style={styles.expandableContent}>
              <View style={styles.visibilityGrid}>
                {[
                  { value: 'public' as ActivityVisibility, label: t('activity.visibilityPublic'), icon: 'earth', desc: t('activity.visibilityPublicDesc') || 'Everyone can see' },
                  { value: 'unit' as ActivityVisibility, label: t('activity.visibilityUnit'), icon: 'people', desc: t('activity.visibilityUnitDesc') || 'Only your unit' },
                  { value: 'private' as ActivityVisibility, label: t('activity.visibilityPrivate'), icon: 'lock-closed', desc: t('activity.visibilityPrivateDesc') || 'Only you' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.visibilityOption,
                      visibility === option.value && styles.visibilityOptionActive
                    ]}
                    onPress={() => {
                      hapticSelect();
                      setVisibility(option.value);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={24}
                      color={visibility === option.value ? '#FFFFFF' : theme.colors.textSecondary}
                    />
                    <Text
                      variant="body"
                      style={[
                        styles.visibilityLabel,
                        { color: visibility === option.value ? '#FFFFFF' : theme.colors.textPrimary }
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text
                      variant="caption"
                      style={{
                        color: visibility === option.value ? 'rgba(255,255,255,0.8)' : theme.colors.textTertiary,
                        textAlign: 'center',
                      }}
                    >
                      {option.desc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Save Button */}
        <View style={styles.saveButtonContainer}>
          <Button
            variant="primary"
            onPress={handleSave}
            style={styles.saveButton}
            disabled={loading || !isFormValid}
          >
            {loading ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text variant="body" style={styles.buttonText}>
                  {t('common.saving')}
                </Text>
              </View>
            ) : !isFormValid ? (
              <View style={styles.buttonContent}>
                <Ionicons name="alert-circle-outline" size={20} color="#FFFFFF" />
                <Text variant="body" style={styles.buttonText}>
                  {t('activity.completeRequired')}
                </Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text variant="body" style={styles.buttonText}>
                  {formMode === 'edit' ? t('activity.update') : t('activity.save')}
                </Text>
              </View>
            )}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    profileButton: {
      borderRadius: 20,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    greetingText: {
      color: 'rgba(255, 255, 255, 0.8)',
      marginBottom: 2,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.md,
    },

    // Type Selection
    typeContainer: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
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
      gap: 6,
    },
    typeButtonText: {
      fontWeight: '600',
      fontSize: 12,
    },

    // Main Card
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },

    // Input styling
    inputGroup: {
      marginBottom: theme.spacing.md,
    },
    inputLabel: {
      marginBottom: theme.spacing.xs,
      marginLeft: 2,
    },
    textInput: {
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm + 2,
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textPrimary,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    textInputError: {
      borderColor: theme.colors.error,
    },
    errorText: {
      color: theme.colors.error,
      marginTop: 4,
      marginLeft: 2,
    },

    // Switch
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    switchInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    switchLabel: {
      fontWeight: '500',
    },

    // Date/Time
    rowContainer: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    dateTimeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: theme.borderRadius.md,
      paddingVertical: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    dateTimeText: {
      fontWeight: '500',
    },

    // Duration
    durationContainer: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    durationInput: {
      flex: 1,
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm + 2,
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textPrimary,
      borderWidth: 1,
      borderColor: theme.colors.border,
      textAlign: 'center',
    },
    unitSelector: {
      flex: 2,
      flexDirection: 'row',
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    unitButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.sm + 2,
    },
    unitButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    unitButtonText: {
      fontWeight: '600',
      fontSize: 12,
    },

    // Section title
    sectionTitle: {
      marginBottom: theme.spacing.sm,
      marginLeft: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    // Expandable cards
    expandableCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.sm,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 4,
      elevation: 1,
    },
    expandableHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
    },
    expandableHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    expandableHeaderText: {
      marginLeft: theme.spacing.sm,
      flex: 1,
    },
    expandableTitle: {
      fontWeight: '600',
    },
    expandableContent: {
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
      paddingTop: 0,
    },
    expandedInputLabel: {
      marginBottom: 6,
      marginLeft: 2,
    },

    // Text area
    textArea: {
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textPrimary,
      borderWidth: 1,
      borderColor: theme.colors.border,
      minHeight: 120,
      textAlignVertical: 'top',
    },

    // Visibility
    visibilityGrid: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    visibilityOption: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xs,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.backgroundSecondary,
      gap: 6,
    },
    visibilityOptionActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    visibilityLabel: {
      fontWeight: '600',
      fontSize: 13,
    },

    // Save button
    saveButtonContainer: {
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    saveButton: {
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      minHeight: 56,
    },
    buttonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
    },
    buttonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: theme.typography.fontSize.base,
    },
  });
}
