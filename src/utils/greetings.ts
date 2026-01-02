/**
 * SHIFT-AWARE GREETINGS
 *
 * Provides time-based greetings that acknowledge first responder schedules.
 * Considers typical shift patterns and shows empathetic messages.
 */

export type GreetingType =
  | 'earlyMorning'   // 4:00 - 6:00
  | 'morning'        // 6:00 - 12:00
  | 'afternoon'      // 12:00 - 17:00
  | 'evening'        // 17:00 - 21:00
  | 'night'          // 21:00 - 4:00
  ;

export interface Greeting {
  key: string;
  icon: string;
  type: GreetingType;
}

/**
 * Get the current greeting based on time of day
 * Returns a greeting key that should be translated
 */
export function getGreeting(date: Date = new Date()): Greeting {
  const hour = date.getHours();

  // Early morning (4:00 - 6:00) - Just ended night shift or starting early
  if (hour >= 4 && hour < 6) {
    return {
      key: 'greetings.earlyMorning',
      icon: 'sunny-outline',
      type: 'earlyMorning',
    };
  }

  // Morning (6:00 - 12:00)
  if (hour >= 6 && hour < 12) {
    return {
      key: 'greetings.morning',
      icon: 'sunny',
      type: 'morning',
    };
  }

  // Afternoon (12:00 - 17:00)
  if (hour >= 12 && hour < 17) {
    return {
      key: 'greetings.afternoon',
      icon: 'partly-sunny',
      type: 'afternoon',
    };
  }

  // Evening (17:00 - 21:00)
  if (hour >= 17 && hour < 21) {
    return {
      key: 'greetings.evening',
      icon: 'moon-outline',
      type: 'evening',
    };
  }

  // Night (21:00 - 4:00) - Night shift
  return {
    key: 'greetings.night',
    icon: 'moon',
    type: 'night',
  };
}

/**
 * Get a motivational message based on time
 * These are supportive messages for first responders
 */
export function getMotivationalMessage(date: Date = new Date()): string {
  const greeting = getGreeting(date);

  // Return translation key for motivational message
  return `greetings.motivation.${greeting.type}`;
}

/**
 * Check if it's likely a night shift based on time
 */
export function isNightShift(date: Date = new Date()): boolean {
  const hour = date.getHours();
  return hour >= 21 || hour < 6;
}

/**
 * Get day of week greeting variation
 * Adds context for weekends or specific days
 */
export function getDayContext(date: Date = new Date()): string | null {
  const day = date.getDay();

  // Weekend
  if (day === 0 || day === 6) {
    return 'greetings.weekend';
  }

  // Monday
  if (day === 1) {
    return 'greetings.monday';
  }

  // Friday
  if (day === 5) {
    return 'greetings.friday';
  }

  return null;
}
