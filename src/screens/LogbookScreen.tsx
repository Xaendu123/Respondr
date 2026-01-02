/**
 * LOGBOOK SCREEN
 * 
 * Displays all user activities with ability to view and edit them.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedAvatar, Button, Card, Text } from '../components/ui';
import { useActivities } from '../hooks/useActivities';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import { useToast } from '../providers/ToastProvider';
import { Activity } from '../types';
import { formatDurationWithTranslation } from '../utils/formatDuration';
import { hapticError, hapticHeavy, hapticLight, hapticSelect, hapticSuccess, hapticWarning } from '../utils/haptics';

// ExpandableText component for truncating long text with "More..." option
interface ExpandableTextProps {
  text: string;
  maxLength: number;
  style?: any;
  theme: ReturnType<typeof useTheme>['theme'];
  t: (key: string) => string;
}

function ExpandableText({ text, maxLength, style, theme, t }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const needsTruncation = text.length > maxLength;

  const displayText = isExpanded || !needsTruncation
    ? text
    : text.slice(0, maxLength).trim() + '...';

  return (
    <View>
      <Text variant="body" color="textSecondary" style={style}>
        {displayText}
        {needsTruncation && !isExpanded && (
          <Text
            variant="body"
            style={{ color: theme.colors.primary, fontWeight: '600' }}
            onPress={() => {
              hapticLight();
              setIsExpanded(true);
            }}
          >
            {' '}{t('common.more')}
          </Text>
        )}
      </Text>
      {needsTruncation && isExpanded && (
        <TouchableOpacity
          onPress={() => {
            hapticLight();
            setIsExpanded(false);
          }}
          style={{ marginTop: 4 }}
        >
          <Text variant="caption" style={{ color: theme.colors.primary, fontWeight: '600' }}>
            {t('common.showLess')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function LogbookScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { activities, loading, refresh, deleteActivity } = useActivities('mine');
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isFirstFocus = useRef(true);
  
  const styles = createStyles(theme);
  
  // Handle manual refresh (pull-to-refresh)
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);
  
  // Refresh activities when screen comes into focus (e.g., after saving from LogActivityScreen)
  // Skip refresh on first focus to prevent pull-down animation on initial load
  useFocusEffect(
    useCallback(() => {
      if (user) {
        // Skip refresh on first focus - activities are already loaded on mount
        if (isFirstFocus.current) {
          isFirstFocus.current = false;
          return;
        }
        // Refresh on subsequent focuses (returning from another screen)
        // Don't show refresh animation when returning from another screen
        refresh();
      }
    }, [refresh, user])
  );
  
  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'training': return theme.colors.info;
      case 'exercise': return theme.colors.warning;
      case 'operation': return theme.colors.error;
      default: return theme.colors.primary;
    }
  };
  
  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'training': return 'book-outline';
      case 'exercise': return 'fitness-outline';
      case 'operation': return 'flash-outline';
      default: return 'flag-outline';
    }
  };
  
  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'training': return t('activity.typeTraining');
      case 'exercise': return t('activity.typeExercise');
      case 'operation': return t('activity.typeOperation');
      default: return type;
    }
  };
  
  const getCategoryLabel = (category: string | undefined): string => {
    if (!category) return '';
    
    // Map category values to translation keys
    const categoryTranslationMap: Record<string, string> = {
      'A1 - Brand klein': 'activity.categoryA1',
      'A2 - Brand mittel': 'activity.categoryA2',
      'A3 - Brand gross': 'activity.categoryA3',
      'B1 - Elementar klein': 'activity.categoryB1',
      'B2 - Elementar mittel': 'activity.categoryB2',
      'B3 - Elementar gross': 'activity.categoryB3',
      'C1 - Hilfeleistung klein': 'activity.categoryC1',
      'C2 - Hilfeleistung mittel': 'activity.categoryC2',
      'C3 - Hilfeleistung gross': 'activity.categoryC3',
      'D1 - Öl/Benzin/Gas klein': 'activity.categoryD1',
      'D2 - Öl/Benzin/Gas mittel': 'activity.categoryD2',
      'D3 - Öl/Benzin/Gas gross': 'activity.categoryD3',
      'E1 - ABC klein': 'activity.categoryE1',
      'E2 - ABC mittel': 'activity.categoryE2',
      'E3 - ABC gross': 'activity.categoryE3',
      'F1 - PbU klein': 'activity.categoryF1',
      'F2 - PbU mittel': 'activity.categoryF2',
      'F3 - PbU gross': 'activity.categoryF3',
      'G1 - Tierrettung klein': 'activity.categoryG1',
      'G2 - Tierrettung mittel': 'activity.categoryG2',
    };
    
    const translationKey = categoryTranslationMap[category];
    if (translationKey) {
      return t(translationKey);
    }
    
    // If no translation found, return the category as-is
    return category;
  };
  
  const handleDeleteActivity = (activityId: string) => {
    hapticWarning();
    Alert.alert(
      t('activity.delete'),
      t('activity.deleteConfirm'),
      [
        { 
          text: t('common.cancel'), 
          style: 'cancel',
          onPress: () => hapticLight(),
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              hapticHeavy();
              await deleteActivity(activityId);
              hapticSuccess();
              showToast({ type: 'success', message: t('logbook.deleteSuccess') });
            } catch (error) {
              hapticError();
              showToast({ type: 'error', message: t('logbook.deleteError') });
            }
          },
        },
      ]
    );
  };
  
  const handleEditActivity = (activity: Activity) => {
    hapticLight();
    // Navigate to edit screen with activity data
    // Add timestamp to ensure params always change, even for same activity
    router.push({
      pathname: '/(tabs)/log',
      params: { 
        formMode: 'edit',
        activityData: JSON.stringify(activity),
        _ts: Date.now().toString(), // Timestamp to force param change
      },
    });
  };
  
  const toggleExpand = (activityId: string) => {
    hapticSelect();
    setExpandedActivityId(expandedActivityId === activityId ? null : activityId);
  };
  
  // Filter activities based on search and type
  const filteredActivities = activities.filter((activity) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' ||
      activity.title.toLowerCase().includes(searchLower) ||
      activity.description?.toLowerCase().includes(searchLower) ||
      activity.situation?.toLowerCase().includes(searchLower) ||
      activity.lessonsLearned?.toLowerCase().includes(searchLower) ||
      activity.location?.toLowerCase().includes(searchLower);

    const matchesType = selectedTypeFilter === 'all' || activity.type === selectedTypeFilter;

    return matchesSearch && matchesType;
  });
  
  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.emptyState}>
          <Ionicons name="person-circle-outline" size={80} color={theme.colors.textTertiary} />
          <Text variant="headingMedium" color="textSecondary" style={styles.emptyText}>
            {t('profile.notLoggedIn')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
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
          <Text variant="headingLarge" style={{ color: '#FFFFFF' }}>{t('logbook.title')}</Text>
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
      
      {/* Search and Filter */}
      <View style={styles.searchFilterContainer}>
        <Card glass style={styles.searchCard}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('logbook.search')}
              placeholderTextColor={theme.colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </Card>
        
        {/* Type Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedTypeFilter === 'all' && styles.filterChipActive,
            ]}
            onPress={() => {
              hapticSelect();
              setSelectedTypeFilter('all');
            }}
          >
            <Text
              variant="caption"
              style={{
                color: selectedTypeFilter === 'all' ? '#FFFFFF' : theme.colors.textSecondary,
                fontWeight: '600',
              }}
            >
              {t('logbook.all')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedTypeFilter === 'training' && styles.filterChipActive,
              selectedTypeFilter === 'training' && { 
                backgroundColor: theme.colors.info,
                borderColor: theme.colors.info,
              },
            ]}
            onPress={() => {
              hapticSelect();
              setSelectedTypeFilter('training');
            }}
          >
            <Ionicons 
              name="book-outline" 
              size={14} 
              color={selectedTypeFilter === 'training' ? '#FFFFFF' : theme.colors.info} 
            />
            <Text
              variant="caption"
              style={{
                color: selectedTypeFilter === 'training' ? '#FFFFFF' : theme.colors.textSecondary,
                fontWeight: '600',
              }}
            >
              {t('activity.typeTraining')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedTypeFilter === 'exercise' && styles.filterChipActive,
              selectedTypeFilter === 'exercise' && { 
                backgroundColor: theme.colors.warning,
                borderColor: theme.colors.warning,
              },
            ]}
            onPress={() => {
              hapticSelect();
              setSelectedTypeFilter('exercise');
            }}
          >
            <Ionicons 
              name="fitness-outline" 
              size={14} 
              color={selectedTypeFilter === 'exercise' ? '#FFFFFF' : theme.colors.warning} 
            />
            <Text
              variant="caption"
              style={{
                color: selectedTypeFilter === 'exercise' ? '#FFFFFF' : theme.colors.textSecondary,
                fontWeight: '600',
              }}
            >
              {t('activity.typeExercise')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedTypeFilter === 'operation' && styles.filterChipActive,
              selectedTypeFilter === 'operation' && { 
                backgroundColor: theme.colors.error,
                borderColor: theme.colors.error,
              },
            ]}
            onPress={() => {
              hapticSelect();
              setSelectedTypeFilter('operation');
            }}
          >
            <Ionicons 
              name="flash-outline" 
              size={14} 
              color={selectedTypeFilter === 'operation' ? '#FFFFFF' : theme.colors.error} 
            />
            <Text
              variant="caption"
              style={{
                color: selectedTypeFilter === 'operation' ? '#FFFFFF' : theme.colors.textSecondary,
                fontWeight: '600',
              }}
            >
              {t('activity.typeOperation')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
        
        {/* Results count - subtle */}
        {(searchQuery !== '' || selectedTypeFilter !== 'all') && (
          <Text variant="caption" color="textTertiary" style={styles.resultsCount}>
            {filteredActivities.length} {t('logbook.results')}
          </Text>
        )}
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: theme.spacing.md + insets.bottom + 60 }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {filteredActivities.length === 0 && activities.length === 0 ? (
          <Card style={styles.emptyCard} glass>
            <Ionicons name="book-outline" size={64} color={theme.colors.textTertiary} />
            <Text variant="headingMedium" color="textSecondary" style={styles.emptyTitle}>
              {t('logbook.empty')}
            </Text>
            <Text variant="body" color="textTertiary" style={styles.emptyDescription}>
              {t('logbook.emptyDescription')}
            </Text>
            <Button 
              variant="primary"
              onPress={() => router.push('/(tabs)/log')}
              style={styles.logFirstButton}
            >
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text variant="body" color="textInverse" style={styles.buttonText}>
                {t('activity.logNew')}
              </Text>
            </Button>
          </Card>
        ) : filteredActivities.length === 0 ? (
          <Card style={styles.emptyCard} glass>
            <Ionicons name="search-outline" size={64} color={theme.colors.textTertiary} />
            <Text variant="headingMedium" color="textSecondary" style={styles.emptyTitle}>
              {t('logbook.noResults')}
            </Text>
            <Text variant="body" color="textTertiary" style={styles.emptyDescription}>
              {t('logbook.noResultsDescription')}
            </Text>
            <Button 
              variant="outline"
              onPress={() => {
                setSearchQuery('');
                hapticLight();
                setSelectedTypeFilter('all');
              }}
              style={styles.clearFiltersButton}
            >
              <Text variant="body" color="primary">
                {t('logbook.clearFilters')}
              </Text>
            </Button>
          </Card>
        ) : (
          <View style={styles.activitiesList}>
            {filteredActivities.map((activity) => {
              const typeColor = getActivityTypeColor(activity.type);
              const typeIcon = getActivityTypeIcon(activity.type);
              const typeLabel = getActivityTypeLabel(activity.type);
              const isExpanded = expandedActivityId === activity.id;
              
              return (
                <Card key={activity.id} style={styles.activityCard} glass>
                  <TouchableOpacity
                    onPress={() => toggleExpand(activity.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.activityHeader}>
                      <View style={[styles.activityTypeIcon, { backgroundColor: typeColor + '15' }]}>
                        <Ionicons name={typeIcon as any} size={24} color={typeColor} />
                      </View>
                      <View style={styles.activityHeaderContent}>
                        <Text variant="body" style={styles.activityTitle}>{activity.title}</Text>
                        <View style={styles.badgesContainer}>
                          <View style={[styles.typeBadge, { backgroundColor: typeColor + '20' }]}>
                            <Text variant="caption" style={{ color: typeColor, fontWeight: '600' }}>
                              {typeLabel}
                            </Text>
                          </View>
                          {activity.type === 'operation' && activity.category && (
                            <View style={[styles.categoryBadge, { backgroundColor: theme.colors.success + '20' }]}>
                              <Text variant="caption" style={{ color: theme.colors.success, fontWeight: '600' }}>
                                {getCategoryLabel(activity.category)}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <Ionicons 
                        name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                        size={24} 
                        color={theme.colors.textSecondary} 
                      />
                    </View>
                  </TouchableOpacity>
                  
                  {isExpanded && (
                    <>
                      {/* Situation Section */}
                      {activity.situation && (
                        <View style={styles.activityDetail}>
                          <View style={styles.detailHeader}>
                            <Ionicons name="document-text-outline" size={16} color={theme.colors.primary} />
                            <Text variant="label" color="primary" style={styles.detailLabel}>
                              {t('activity.situation')}
                            </Text>
                          </View>
                          <ExpandableText
                            text={activity.situation}
                            maxLength={150}
                            style={styles.activityDescription}
                            theme={theme}
                            t={t}
                          />
                        </View>
                      )}

                      {/* Lessons Learned Section */}
                      {activity.lessonsLearned && (
                        <View style={styles.activityDetail}>
                          <View style={styles.detailHeader}>
                            <Ionicons name="bulb-outline" size={16} color={theme.colors.warning} />
                            <Text variant="label" color="warning" style={styles.detailLabel}>
                              {t('activity.lessonsLearned')}
                            </Text>
                          </View>
                          <ExpandableText
                            text={activity.lessonsLearned}
                            maxLength={150}
                            style={styles.activityDescription}
                            theme={theme}
                            t={t}
                          />
                        </View>
                      )}

                      {/* Legacy description fallback */}
                      {activity.description && !activity.situation && !activity.lessonsLearned && (
                        <View style={styles.activityDetail}>
                          <Text variant="body" color="textSecondary" style={styles.activityDescription}>
                            {activity.description}
                          </Text>
                        </View>
                      )}
                      
                      <View style={styles.activityMeta}>
                        <View style={styles.metaItem}>
                          <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
                          <Text variant="caption" color="textSecondary">
                            {new Date(activity.date).toLocaleDateString()}
                          </Text>
                        </View>
                        
                        <View style={styles.metaItem}>
                          <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
                          <Text variant="caption" color="textSecondary">
                            {formatDurationWithTranslation(activity.duration, t)}
                          </Text>
                        </View>
                        
                        {activity.location && (
                          <View style={styles.metaItem}>
                            <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
                            <Text variant="caption" color="textSecondary" numberOfLines={1}>
                              {activity.location}
                            </Text>
                          </View>
                        )}
                      </View>
                      
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.editButton]}
                          onPress={() => handleEditActivity(activity)}
                        >
                          <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                          <Text variant="body" style={{ color: theme.colors.primary }}>
                            {t('common.edit')}
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[styles.actionButton, styles.deleteButton]}
                          onPress={() => handleDeleteActivity(activity.id)}
                        >
                          <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                          <Text variant="body" style={{ color: theme.colors.error }}>
                            {t('common.delete')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
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
    searchFilterContainer: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    searchCard: {
      padding: theme.spacing.md,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    searchInput: {
      flex: 1,
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textPrimary,
      padding: 0,
    },
    filterScroll: {
      flexGrow: 0,
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      marginRight: theme.spacing.xs,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    filterChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    resultsCount: {
      textAlign: 'center',
      fontSize: theme.typography.fontSize.xs,
      opacity: 0.5,
    },
    clearFiltersButton: {
      marginTop: theme.spacing.md,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: theme.spacing.md,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xxl,
    },
    emptyText: {
      marginTop: theme.spacing.md,
      textAlign: 'center',
    },
    emptyCard: {
      padding: theme.spacing.xxl,
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    emptyTitle: {
      textAlign: 'center',
    },
    emptyDescription: {
      textAlign: 'center',
      paddingHorizontal: theme.spacing.lg,
    },
    logFirstButton: {
      marginTop: theme.spacing.md,
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    buttonText: {
      fontWeight: '600',
    },
    activitiesList: {
      gap: theme.spacing.md,
    },
    activityCard: {
      padding: theme.spacing.lg,
    },
    activityHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    activityTypeIcon: {
      width: 48,
      height: 48,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activityHeaderContent: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    activityTitle: {
      fontWeight: '600',
      fontSize: theme.typography.fontSize.lg,
    },
    badgesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    typeBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
    },
    categoryBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
    },
    activityDetail: {
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    detailHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
    },
    detailLabel: {
      fontWeight: '600',
      fontSize: theme.typography.fontSize.sm,
    },
    activityDescription: {
      lineHeight: 20,
    },
    activityMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
      paddingTop: theme.spacing.md,
      marginTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    editButton: {
      backgroundColor: theme.colors.primary + '10',
      borderColor: theme.colors.primary + '30',
    },
    deleteButton: {
      backgroundColor: theme.colors.error + '10',
      borderColor: theme.colors.error + '30',
    },
  });
}

