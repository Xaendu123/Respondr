/**
 * LOGBOOK SCREEN
 * 
 * Displays all user activities with ability to view and edit them.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Text } from '../components/ui';
import { useActivities } from '../hooks/useActivities';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import { Activity } from '../types';
import { formatDurationWithTranslation } from '../utils/formatDuration';
import { hapticError, hapticHeavy, hapticLight, hapticSelect, hapticSuccess, hapticWarning } from '../utils/haptics';

export function LogbookScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { activities, loading, refresh, deleteActivity } = useActivities('mine');
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  
  const styles = createStyles(theme);
  
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
              Alert.alert(t('common.success'), t('logbook.deleteSuccess'));
            } catch (error) {
              hapticError();
              Alert.alert(t('common.error'), t('logbook.deleteError'));
            }
          },
        },
      ]
    );
  };
  
  const handleEditActivity = (activity: Activity) => {
    hapticLight();
    // Navigate to edit screen with activity data
    Alert.alert(
      t('common.comingSoon'),
      t('logbook.editComingSoon')
    );
  };
  
  const toggleExpand = (activityId: string) => {
    hapticSelect();
    setExpandedActivityId(expandedActivityId === activityId ? null : activityId);
  };
  
  // Filter activities based on search and type
  const filteredActivities = activities.filter((activity) => {
    const matchesSearch = searchQuery === '' || 
      activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.gradientStart} translucent={true} />
      {/* Header with Gradient */}
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text variant="headingLarge" style={{ color: '#FFFFFF' }}>{t('logbook.title')}</Text>
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
              selectedTypeFilter === 'training' && { backgroundColor: theme.colors.info },
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
              selectedTypeFilter === 'exercise' && { backgroundColor: theme.colors.warning },
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
              selectedTypeFilter === 'operation' && { backgroundColor: theme.colors.error },
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
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {filteredActivities.length === 0 && activities.length === 0 ? (
          <Card style={styles.emptyCard} glass elevated>
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
          <Card style={styles.emptyCard} glass elevated>
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
                <Card key={activity.id} style={styles.activityCard} glass elevated>
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
                        <View style={[styles.typeBadge, { backgroundColor: typeColor + '20' }]}>
                          <Text variant="caption" style={{ color: typeColor, fontWeight: '600' }}>
                            {typeLabel}
                          </Text>
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
                      {activity.description && (
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
                          style={styles.actionButton}
                          onPress={() => handleEditActivity(activity)}
                        >
                          <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                          <Text variant="body" color="primary">
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
    typeBadge: {
      alignSelf: 'flex-start',
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
    deleteButton: {
      backgroundColor: theme.colors.error + '10',
      borderColor: theme.colors.error + '30',
    },
  });
}

