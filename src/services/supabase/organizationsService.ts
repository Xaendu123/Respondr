/**
 * ORGANIZATIONS SERVICE
 * 
 * Handles organization lookup and creation.
 * Organizations are stored as text in profiles, but we provide autocomplete
 * by querying distinct organization values from existing profiles.
 */

import { supabase } from '../../config/supabase';

/**
 * Search for organizations matching the query
 * Returns distinct organization names from profiles table
 */
export const searchOrganizations = async (query: string): Promise<string[]> => {
  try {
    // Search for organizations that contain the query (case-insensitive)
    const { data, error } = await supabase
      .from('profiles')
      .select('organization')
      .not('organization', 'is', null)
      .neq('organization', '')
      .ilike('organization', `%${query}%`)
      .limit(10);

    if (error) {
      // If RLS blocks access, return empty array (safe fallback)
      if (error.code === 'PGRST301' || error.message.includes('permission')) {
        return [];
      }
      throw error;
    }

    // Extract distinct organization names and filter out empty/null
    const organizations = new Set<string>();
    data?.forEach((profile) => {
      if (profile.organization && profile.organization.trim()) {
        organizations.add(profile.organization.trim());
      }
    });

    return Array.from(organizations).sort();
  } catch (error) {
    console.warn('Could not search organizations:', error);
    return []; // Safe fallback - user can still type new organization
  }
};

/**
 * Get all organizations (for initial dropdown)
 */
export const getAllOrganizations = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('organization')
      .not('organization', 'is', null)
      .neq('organization', '')
      .limit(50); // Limit to prevent huge lists

    if (error) {
      if (error.code === 'PGRST301' || error.message.includes('permission')) {
        return [];
      }
      throw error;
    }

    // Extract distinct organization names
    const organizations = new Set<string>();
    data?.forEach((profile) => {
      if (profile.organization && profile.organization.trim()) {
        organizations.add(profile.organization.trim());
      }
    });

    return Array.from(organizations).sort();
  } catch (error) {
    console.warn('Could not get organizations:', error);
    return [];
  }
};

