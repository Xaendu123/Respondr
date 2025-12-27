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
    // Use the database function to search organizations
    // This function respects privacy while allowing organization search
    const { data, error } = await supabase.rpc('search_organizations', {
      search_query: query.trim(),
    });

    if (error) {
      // Log the error for debugging
      console.warn('Organization search error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      
      // If function doesn't exist, fall back to empty array
      if (error.code === '42883' || error.message?.includes('does not exist')) {
        console.warn('search_organizations function not found, falling back to empty results');
        return [];
      }
      
      // For other errors, return empty array
      return [];
    }

    // Extract organization names and filter out empty/null
    const organizations: string[] = [];
    data?.forEach((row: { organization: string }) => {
      if (row.organization && row.organization.trim()) {
        organizations.push(row.organization.trim());
      }
    });

    return organizations.sort();
  } catch (error: any) {
    // Log unexpected errors
    console.warn('Could not search organizations:', error);
    return []; // Safe fallback - user can still type new organization
  }
};

/**
 * Get all organizations (for initial dropdown)
 */
export const getAllOrganizations = async (): Promise<string[]> => {
  try {
    // Use the database function to get all organizations (empty query returns all)
    const { data, error } = await supabase.rpc('search_organizations', {
      search_query: '',
    });

    if (error) {
      // Log the error for debugging
      console.warn('Get all organizations error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      
      // If function doesn't exist, fall back to empty array
      if (error.code === '42883' || error.message?.includes('does not exist')) {
        console.warn('search_organizations function not found, falling back to empty results');
        return [];
      }
      
      // For other errors, return empty array
      return [];
    }

    // Extract organization names and filter out empty/null
    const organizations: string[] = [];
    data?.forEach((row: { organization: string }) => {
      if (row.organization && row.organization.trim()) {
        organizations.push(row.organization.trim());
      }
    });

    // Limit to 50 for the dropdown
    return organizations.slice(0, 50).sort();
  } catch (error: any) {
    // Log unexpected errors
    console.warn('Could not get organizations:', error);
    return [];
  }
};

