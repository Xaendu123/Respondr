/**
 * SUPABASE ACTIVITIES SERVICE
 * 
 * Handles all activity-related operations with Supabase.
 */

import { supabase } from '../../config/supabase';
import { Activity, ActivityType, Comment, Reaction } from '../../types';

export interface CreateActivityData {
  type: ActivityType;
  title: string;
  description?: string;
  situation?: string;
  lessonsLearned?: string;
  duration: number;
  date: Date;
  location?: string;
  latitude?: number;
  longitude?: number;
  unitId?: string;
  visibility?: 'private' | 'unit' | 'public';
  category?: string;
  falseAlarm?: boolean;
  tags?: string[];
  images?: string[];
}

export interface UpdateActivityData extends Partial<CreateActivityData> {
  id: string;
}

/**
 * Get activities feed (all, unit, or user-specific)
 */
export const getActivities = async (
  filter: 'all' | 'unit' | 'mine' = 'all'
): Promise<Activity[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('No authenticated user');

  let query = supabase
    .from('activities')
    .select(`
      *,
      profiles!user_id (
        id,
        display_name,
        avatar
      ),
      reactions (*),
      comments (*)
    `)
    .order('date', { ascending: false });

  // Apply filters
  if (filter === 'mine') {
    query = query.eq('user_id', user.id);
  } else if (filter === 'unit') {
    // Get user's unit_id first
    const { data: profile } = await supabase
      .from('profiles')
      .select('unit_id')
      .eq('id', user.id)
      .single();
    
    if (profile?.unit_id) {
      query = query.eq('unit_id', profile.unit_id);
    }
  }

  const { data, error } = await query;

  if (error) throw error;

  return data.map(mapActivityFromSupabase);
};

/**
 * Get a single activity by ID
 */
export const getActivity = async (id: string): Promise<Activity> => {
  const { data, error } = await supabase
    .from('activities')
    .select(`
      *,
      profiles!user_id (
        id,
        display_name,
        avatar
      ),
      reactions (*),
      comments (*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;

  return mapActivityFromSupabase(data);
};

/**
 * Create a new activity
 */
export const createActivity = async (activityData: CreateActivityData): Promise<Activity> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('No authenticated user');

  // Get user profile info
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar')
    .eq('id', user.id)
    .single();

  const { data, error } = await supabase
    .from('activities')
    .insert({
      user_id: user.id,
      type: activityData.type,
      title: activityData.title,
      description: activityData.description,
      situation: activityData.situation,
      lessons_learned: activityData.lessonsLearned,
      duration: activityData.duration,
      date: activityData.date.toISOString(),
      location: activityData.location,
      latitude: activityData.latitude,
      longitude: activityData.longitude,
      unit_id: activityData.unitId,
      visibility: activityData.visibility || 'unit',
      category: activityData.category || null,
      false_alarm: activityData.falseAlarm || false,
      tags: activityData.tags,
      images: activityData.images,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select(`
      *,
      reactions (*),
      comments (*)
    `)
    .single();

  if (error) throw error;

  // Manually add profile data since we can't join on insert
  return {
    ...mapActivityFromSupabase(data),
    userDisplayName: profile?.display_name || 'Unknown',
    userAvatar: profile?.avatar,
  };
};

/**
 * Update an existing activity
 */
export const updateActivity = async (activityData: UpdateActivityData): Promise<Activity> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('No authenticated user');

  const { data, error } = await supabase
    .from('activities')
    .update({
      type: activityData.type,
      title: activityData.title,
      description: activityData.description,
      situation: activityData.situation,
      lessons_learned: activityData.lessonsLearned,
      duration: activityData.duration,
      date: activityData.date?.toISOString(),
      location: activityData.location,
      latitude: activityData.latitude,
      longitude: activityData.longitude,
      visibility: activityData.visibility,
      category: activityData.category !== undefined ? (activityData.category || null) : undefined,
      false_alarm: activityData.falseAlarm !== undefined ? activityData.falseAlarm : undefined,
      tags: activityData.tags,
      images: activityData.images,
      updated_at: new Date().toISOString(),
    })
    .eq('id', activityData.id)
    .eq('user_id', user.id) // Ensure user owns the activity
    .select(`
      *,
      profiles!user_id (
        id,
        display_name,
        avatar
      ),
      reactions (*),
      comments (*)
    `)
    .single();

  if (error) throw error;

  return mapActivityFromSupabase(data);
};

/**
 * Delete an activity
 */
export const deleteActivity = async (id: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('No authenticated user');

  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id); // Ensure user owns the activity

  if (error) throw error;
};

/**
 * Add a reaction to an activity
 */
export const addReaction = async (
  activityId: string,
  type: 'respect' | 'strong' | 'teamwork' | 'impressive'
): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('No authenticated user');

  const { error } = await supabase
    .from('reactions')
    .insert({
      activity_id: activityId,
      user_id: user.id,
      type: type,
      created_at: new Date().toISOString(),
    });

  if (error) throw error;
};

/**
 * Remove a reaction from an activity
 */
export const removeReaction = async (activityId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('No authenticated user');

  const { error } = await supabase
    .from('reactions')
    .delete()
    .eq('activity_id', activityId)
    .eq('user_id', user.id);

  if (error) throw error;
};

/**
 * Add a comment to an activity
 */
export const addComment = async (activityId: string, text: string): Promise<Comment> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('No authenticated user');

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar')
    .eq('id', user.id)
    .single();

  const { data, error } = await supabase
    .from('comments')
    .insert({
      activity_id: activityId,
      user_id: user.id,
      text: text,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    activityId: data.activity_id,
    userId: data.user_id,
    userDisplayName: profile?.display_name || 'Unknown',
    userAvatar: profile?.avatar,
    content: data.text,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.created_at),
  };
};

/**
 * Map Supabase activity data to app Activity type
 */
const mapActivityFromSupabase = (data: any): Activity => {
  return {
    id: data.id,
    userId: data.user_id,
    userDisplayName: data.profiles?.display_name || 'Unknown',
    userAvatar: data.profiles?.avatar,
    unitId: data.unit_id,
    type: data.type as ActivityType,
    title: data.title,
    description: data.description,
    situation: data.situation,
    lessonsLearned: data.lessons_learned,
    duration: data.duration,
    date: new Date(data.date),
    location: data.location,
    latitude: data.latitude,
    longitude: data.longitude,
    visibility: data.visibility,
    category: data.category,
    falseAlarm: data.false_alarm || false,
    tags: data.tags || [],
    images: data.images || [],
    reactions: data.reactions?.map((r: any) => ({
      id: r.id,
      activityId: r.activity_id,
      userId: r.user_id,
      type: r.type as Reaction['type'],
      createdAt: new Date(r.created_at),
    })) || [],
    comments: data.comments?.map((c: any) => ({
      id: c.id,
      activityId: c.activity_id,
      userId: c.user_id,
      text: c.text,
      createdAt: new Date(c.created_at),
    })) || [],
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
};

