/**
 * FORMAT DURATION UTILITY
 * 
 * Formats activity duration in minutes to the most appropriate unit.
 */

export interface FormattedDuration {
  value: number;
  unit: 'minutes' | 'hours' | 'days';
  label: string;
}

/**
 * Formats duration in minutes to the most appropriate unit
 * @param durationInMinutes - Duration in minutes
 * @returns Formatted duration with value and unit
 */
export function formatDuration(durationInMinutes: number): FormattedDuration {
  if (durationInMinutes < 60) {
    // Less than 1 hour - show in minutes
    return {
      value: durationInMinutes,
      unit: 'minutes',
      label: `${durationInMinutes} Min.`,
    };
  } else if (durationInMinutes < 1440) {
    // Less than 24 hours - show in hours
    const hours = Math.round(durationInMinutes / 60 * 10) / 10; // Round to 1 decimal
    return {
      value: hours,
      unit: 'hours',
      label: `${hours} Std.`,
    };
  } else {
    // 24 hours or more - show in days
    const days = Math.round(durationInMinutes / 1440 * 10) / 10; // Round to 1 decimal
    return {
      value: days,
      unit: 'days',
      label: `${days} Tg.`,
    };
  }
}

/**
 * Formats duration with translation keys
 * @param durationInMinutes - Duration in minutes
 * @param t - Translation function
 * @returns Formatted duration string
 */
export function formatDurationWithTranslation(
  durationInMinutes: number,
  t: (key: string) => string
): string {
  if (durationInMinutes < 60) {
    // Less than 1 hour - show in minutes
    return `${durationInMinutes} ${t('activity.unitMinutes')}`;
  } else if (durationInMinutes < 1440) {
    // Less than 24 hours - show in hours
    const hours = Math.round(durationInMinutes / 60 * 10) / 10;
    return `${hours} ${t('activity.unitHours')}`;
  } else {
    // 24 hours or more - show in days
    const days = Math.round(durationInMinutes / 1440 * 10) / 10;
    return `${days} ${t('activity.unitDays')}`;
  }
}

