/**
 * formatDuration Utility Tests
 */

import {
  formatDuration,
  formatDurationWithTranslation,
  formatDurationDetailed,
  FormattedDuration,
} from '../../utils/formatDuration';

describe('formatDuration', () => {
  describe('when duration is less than 60 minutes', () => {
    it('should return duration in minutes for 1 minute', () => {
      const result = formatDuration(1);
      expect(result).toEqual<FormattedDuration>({
        value: 1,
        unit: 'minutes',
        label: '1 Min.',
      });
    });

    it('should return duration in minutes for 30 minutes', () => {
      const result = formatDuration(30);
      expect(result).toEqual<FormattedDuration>({
        value: 30,
        unit: 'minutes',
        label: '30 Min.',
      });
    });

    it('should return duration in minutes for 59 minutes', () => {
      const result = formatDuration(59);
      expect(result).toEqual<FormattedDuration>({
        value: 59,
        unit: 'minutes',
        label: '59 Min.',
      });
    });

    it('should handle 0 minutes', () => {
      const result = formatDuration(0);
      expect(result).toEqual<FormattedDuration>({
        value: 0,
        unit: 'minutes',
        label: '0 Min.',
      });
    });
  });

  describe('when duration is between 60 and 1440 minutes (1-24 hours)', () => {
    it('should return duration in hours for exactly 60 minutes', () => {
      const result = formatDuration(60);
      expect(result.unit).toBe('hours');
      expect(result.value).toBe(1);
      expect(result.label).toBe('1 Std.');
    });

    it('should return duration in hours for 90 minutes (1.5 hours)', () => {
      const result = formatDuration(90);
      expect(result.unit).toBe('hours');
      expect(result.value).toBe(1.5);
      expect(result.label).toBe('1.5 Std.');
    });

    it('should return duration in hours for 120 minutes (2 hours)', () => {
      const result = formatDuration(120);
      expect(result.unit).toBe('hours');
      expect(result.value).toBe(2);
      expect(result.label).toBe('2 Std.');
    });

    it('should return duration in hours for 1439 minutes', () => {
      const result = formatDuration(1439);
      expect(result.unit).toBe('hours');
      expect(result.value).toBeCloseTo(24, 1);
    });

    it('should round to 1 decimal place', () => {
      const result = formatDuration(95); // 1.583... hours
      expect(result.unit).toBe('hours');
      expect(result.value).toBe(1.6);
    });
  });

  describe('when duration is 1440 minutes or more (1+ days)', () => {
    it('should return duration in days for exactly 1440 minutes (1 day)', () => {
      const result = formatDuration(1440);
      expect(result.unit).toBe('days');
      expect(result.value).toBe(1);
      expect(result.label).toBe('1 Tg.');
    });

    it('should return duration in days for 2880 minutes (2 days)', () => {
      const result = formatDuration(2880);
      expect(result.unit).toBe('days');
      expect(result.value).toBe(2);
      expect(result.label).toBe('2 Tg.');
    });

    it('should return duration in days for 2160 minutes (1.5 days)', () => {
      const result = formatDuration(2160);
      expect(result.unit).toBe('days');
      expect(result.value).toBe(1.5);
      expect(result.label).toBe('1.5 Tg.');
    });

    it('should handle large durations', () => {
      const result = formatDuration(14400); // 10 days
      expect(result.unit).toBe('days');
      expect(result.value).toBe(10);
    });
  });
});

describe('formatDurationWithTranslation', () => {
  const mockT = (key: string) => {
    const translations: Record<string, string> = {
      'activity.unitMinutes': 'Min',
      'activity.unitHours': 'Hrs',
      'activity.unitDays': 'Days',
    };
    return translations[key] || key;
  };

  describe('when duration is less than 60 minutes', () => {
    it('should format with translated minutes unit', () => {
      const result = formatDurationWithTranslation(30, mockT);
      expect(result).toBe('30 Min');
    });

    it('should handle 1 minute', () => {
      const result = formatDurationWithTranslation(1, mockT);
      expect(result).toBe('1 Min');
    });
  });

  describe('when duration is between 60 and 1440 minutes', () => {
    it('should format with translated hours unit', () => {
      const result = formatDurationWithTranslation(120, mockT);
      expect(result).toBe('2 Hrs');
    });

    it('should format fractional hours', () => {
      const result = formatDurationWithTranslation(90, mockT);
      expect(result).toBe('1.5 Hrs');
    });
  });

  describe('when duration is 1440 minutes or more', () => {
    it('should format with translated days unit', () => {
      const result = formatDurationWithTranslation(2880, mockT);
      expect(result).toBe('2 Days');
    });

    it('should format fractional days', () => {
      const result = formatDurationWithTranslation(2160, mockT);
      expect(result).toBe('1.5 Days');
    });
  });
});

describe('formatDurationDetailed', () => {
  describe('when duration is only minutes', () => {
    it('should return only minutes for 0 minutes', () => {
      expect(formatDurationDetailed(0)).toBe('0m');
    });

    it('should return only minutes for 30 minutes', () => {
      expect(formatDurationDetailed(30)).toBe('30m');
    });

    it('should return only minutes for 59 minutes', () => {
      expect(formatDurationDetailed(59)).toBe('59m');
    });
  });

  describe('when duration includes hours', () => {
    it('should return hours and minutes for 60 minutes', () => {
      expect(formatDurationDetailed(60)).toBe('1h 0m');
    });

    it('should return hours and minutes for 90 minutes', () => {
      expect(formatDurationDetailed(90)).toBe('1h 30m');
    });

    it('should return hours and minutes for 150 minutes', () => {
      expect(formatDurationDetailed(150)).toBe('2h 30m');
    });
  });

  describe('when duration includes days', () => {
    it('should return days, hours, and minutes for 1440 minutes (1 day)', () => {
      expect(formatDurationDetailed(1440)).toBe('1d 0h 0m');
    });

    it('should return days, hours, and minutes for 1530 minutes (1 day, 1.5 hours)', () => {
      expect(formatDurationDetailed(1530)).toBe('1d 1h 30m');
    });

    it('should return days, hours, and minutes for 3000 minutes', () => {
      expect(formatDurationDetailed(3000)).toBe('2d 2h 0m');
    });

    it('should handle large durations', () => {
      expect(formatDurationDetailed(14519)).toBe('10d 1h 59m');
    });
  });

  describe('edge cases', () => {
    it('should floor fractional minutes', () => {
      expect(formatDurationDetailed(30.7)).toBe('30m');
    });

    it('should work without translation function', () => {
      expect(formatDurationDetailed(90)).toBe('1h 30m');
    });

    it('should work with translation function (ignored)', () => {
      const mockT = jest.fn();
      expect(formatDurationDetailed(90, mockT)).toBe('1h 30m');
      expect(mockT).not.toHaveBeenCalled();
    });
  });
});
