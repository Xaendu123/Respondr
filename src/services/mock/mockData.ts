/**
 * DATA LAYER
 * 
 * Initial data and sample content.
 */

import { Activity, Badge, Unit, UserProfile } from '../../types';

/**
 * Sample Users
 */
export const mockUsers: UserProfile[] = [
  {
    id: 'user-1',
    email: 'max.mustermann@example.com',
    displayName: 'Max Mustermann',
    bio: 'Freiwilliger Feuerwehrmann seit 5 Jahren',
    avatar: undefined,
    unitId: 'unit-1',
    role: 'member',
    stats: {
      totalActivities: 45,
      totalHours: 120,
      activitiesByType: {
        training: 20,
        exercise: 15,
        operation: 10,
      },
      activitiesThisMonth: 8,
      activitiesThisYear: 45,
    },
    currentStreak: 7,
    longestStreak: 30,
    badges: ['badge-1', 'badge-2', 'badge-3'],
    preferences: {
      theme: 'system',
      language: 'de',
      notificationsEnabled: true,
      emailNotifications: true,
      pushNotifications: true,
    },
    createdAt: new Date('2020-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'user-2',
    email: 'anna.schmidt@example.com',
    displayName: 'Anna Schmidt',
    bio: 'Rettungssanitäterin',
    avatar: undefined,
    unitId: 'unit-1',
    role: 'leader',
    stats: {
      totalActivities: 62,
      totalHours: 180,
      activitiesByType: {
        training: 25,
        exercise: 22,
        operation: 15,
      },
      activitiesThisMonth: 12,
      activitiesThisYear: 62,
    },
    currentStreak: 14,
    longestStreak: 45,
    badges: ['badge-1', 'badge-2', 'badge-3', 'badge-4'],
    preferences: {
      theme: 'light',
      language: 'de',
      notificationsEnabled: true,
      emailNotifications: true,
      pushNotifications: true,
    },
    createdAt: new Date('2019-06-15'),
    updatedAt: new Date(),
  },
];

/**
 * Sample Units
 */
export const mockUnits: Unit[] = [
  {
    id: 'unit-1',
    name: 'Freiwillige Feuerwehr Musterstadt',
    description: 'Freiwillige Feuerwehr seit 1895',
    type: 'fire',
    location: 'Musterstadt',
    memberCount: 45,
    verified: true,
    createdAt: new Date('1895-01-01'),
  },
  {
    id: 'unit-2',
    name: 'DRK Rettungsdienst Nord',
    description: 'Rettungsdienst seit 1952',
    type: 'ems',
    location: 'Hamburg',
    memberCount: 120,
    verified: true,
    createdAt: new Date('1952-01-01'),
  },
];

/**
 * Sample Activities
 */
export const mockActivities: Activity[] = [
  {
    id: 'activity-1',
    userId: 'user-1',
    userDisplayName: 'Max Mustermann',
    userAvatar: undefined,
    type: 'operation',
    title: 'Brandeinsatz Wohnhaus',
    description: 'Küchenbrand in Mehrfamilienhaus, schnell unter Kontrolle gebracht',
    duration: 180,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    location: 'Hauptstraße 15, Musterstadt',
    latitude: 51.1657,
    longitude: 10.4515,
    participants: ['user-1', 'user-2'],
    unitId: 'unit-1',
    visibility: 'unit',
    tags: ['brand', 'wohnhaus'],
    images: [],
    reactions: [
      {
        id: 'reaction-1',
        activityId: 'activity-1',
        userId: 'user-2',
        type: 'respect',
        createdAt: new Date(),
      },
    ],
    comments: [
      {
        id: 'comment-1',
        userId: 'user-2',
        userDisplayName: 'Anna Schmidt',
        activityId: 'activity-1',
        content: 'Gut gemacht, schnelle Reaktionszeit!',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'activity-2',
    userId: 'user-2',
    userDisplayName: 'Anna Schmidt',
    userAvatar: undefined,
    type: 'training',
    title: 'Atemschutztraining',
    description: 'Jährliches Atemschutztraining in der Übungsanlage',
    duration: 240,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    location: 'Feuerwehr Ausbildungszentrum',
    latitude: 51.1700,
    longitude: 10.4600,
    participants: ['user-1', 'user-2'],
    unitId: 'unit-1',
    visibility: 'public',
    tags: ['atemschutz', 'training'],
    images: [],
    reactions: [
      {
        id: 'reaction-2',
        activityId: 'activity-2',
        userId: 'user-1',
        type: 'strong',
        createdAt: new Date(),
      },
    ],
    comments: [],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'activity-3',
    userId: 'user-1',
    userDisplayName: 'Max Mustermann',
    userAvatar: undefined,
    type: 'exercise',
    title: 'Großübung Industriegelände',
    description: 'Gemeinsame Übung mit mehreren Wehren',
    duration: 300,
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    location: 'Industriepark Süd',
    latitude: 51.1500,
    longitude: 10.4300,
    participants: ['user-1', 'user-2'],
    unitId: 'unit-1',
    visibility: 'public',
    tags: ['übung', 'industrie'],
    images: [],
    reactions: [
      {
        id: 'reaction-3',
        activityId: 'activity-3',
        userId: 'user-2',
        type: 'impressive',
        createdAt: new Date(),
      },
    ],
    comments: [
      {
        id: 'comment-2',
        userId: 'user-2',
        userDisplayName: 'Anna Schmidt',
        activityId: 'activity-3',
        content: 'Tolle Übung, sehr realitätsnah!',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
];

/**
 * Sample Badges
 */
export const mockBadges: Badge[] = [
  {
    id: 'badge-1',
    name: 'Erste Aktivität',
    description: 'Erste Aktivität erfolgreich geloggt',
    icon: 'star',
    level: 'bronze',
    requirement: '1 Aktivität abschließen',
    unlockedAt: new Date('2023-01-15'),
  },
  {
    id: 'badge-2',
    name: 'Wochenkrieger',
    description: '7 Aktivitäten in einer Woche',
    icon: 'flame',
    level: 'silver',
    requirement: '7 Aktivitäten in 7 Tagen',
    unlockedAt: new Date('2023-03-20'),
  },
  {
    id: 'badge-3',
    name: 'Monatsmeister',
    description: '30 Aktivitäten in einem Monat',
    icon: 'trophy',
    level: 'gold',
    requirement: '30 Aktivitäten in 30 Tagen',
    progress: 75,
  },
  {
    id: 'badge-4',
    name: 'Teamplayer',
    description: '50 Aktivitäten mit anderen absolviert',
    icon: 'people',
    level: 'bronze',
    requirement: '50 gemeinsame Aktivitäten',
    progress: 45,
  },
];

/**
 * Current logged-in user
 */
export let currentMockUser: UserProfile | null = null;

/**
 * Set current user session
 */
export function setCurrentMockUser(user: UserProfile | null) {
  currentMockUser = user;
}

/**
 * Generate authentication token
 */
export function generateMockToken(): string {
  return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

