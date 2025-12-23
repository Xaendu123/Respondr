/**
 * ACTIVITIES HOOK
 * 
 * Business logic hook for activities using Supabase.
 * This separates business logic from UI components.
 */

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import * as supabaseActivities from '../services/supabase/activitiesService';
import { Activity, ActivityType, ActivityVisibility } from '../types';

export type ActivityFilter = 'all' | 'unit' | 'mine';

export interface CreateActivityInput {
  type: ActivityType;
  title: string;
  description?: string;
  duration: number;
  date: Date;
  location?: string;
  latitude?: number;
  longitude?: number;
  participants?: string[];
  unitId?: string;
  visibility: ActivityVisibility;
  tags?: string[];
  images?: string[];
}

export function useActivities(filter: ActivityFilter = 'all') {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const loadActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Call Supabase service to get activities
      const data = await supabaseActivities.getActivities(filter);
      setActivities(data);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load activities';
      setError(errorMessage);
      console.error('Error loading activities:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);
  
  const createActivity = useCallback(async (input: CreateActivityInput) => {
    setLoading(true);
    setError(null);
    
    try {
      const newActivity = await supabaseActivities.createActivity({
        type: input.type,
        title: input.title,
        description: input.description,
        duration: input.duration,
        date: input.date,
        location: input.location,
        latitude: input.latitude,
        longitude: input.longitude,
        unitId: input.unitId,
        visibility: input.visibility,
        tags: input.tags,
        images: input.images,
      });
      
      // Add new activity to the list
      setActivities(prev => [newActivity, ...prev]);
      
      return newActivity;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create activity';
      setError(errorMessage);
      console.error('Error creating activity:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const updateActivity = useCallback(async (activityId: string, updates: Partial<CreateActivityInput>) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedActivity = await supabaseActivities.updateActivity({
        id: activityId,
        type: updates.type,
        title: updates.title,
        description: updates.description,
        duration: updates.duration,
        date: updates.date,
        location: updates.location,
        latitude: updates.latitude,
        longitude: updates.longitude,
        visibility: updates.visibility,
        tags: updates.tags,
        images: updates.images,
      });
      
      // Update activity in the list
      setActivities(prev => prev.map(a => a.id === activityId ? updatedActivity : a));
      
      return updatedActivity;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update activity';
      setError(errorMessage);
      console.error('Error updating activity:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const deleteActivity = useCallback(async (activityId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await supabaseActivities.deleteActivity(activityId);
      
      // Remove activity from the list
      setActivities(prev => prev.filter(a => a.id !== activityId));
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete activity';
      setError(errorMessage);
      console.error('Error deleting activity:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadActivities();
  }, [loadActivities]);
  
  return {
    activities,
    loading,
    error,
    refresh: loadActivities,
    createActivity,
    updateActivity,
    deleteActivity,
  };
}

