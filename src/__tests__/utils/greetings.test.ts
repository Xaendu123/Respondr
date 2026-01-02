/**
 * Greetings Utility Tests
 */

import {
  getGreeting,
  getMotivationalMessage,
  isNightShift,
  getDayContext,
  Greeting,
  GreetingType,
} from '../../utils/greetings';

describe('getGreeting', () => {
  const createDate = (hour: number, minute = 0): Date => {
    const date = new Date(2024, 0, 15); // Monday
    date.setHours(hour, minute, 0, 0);
    return date;
  };

  describe('early morning (4:00 - 6:00)', () => {
    it('should return earlyMorning greeting at 4:00', () => {
      const result = getGreeting(createDate(4, 0));
      expect(result.type).toBe('earlyMorning');
      expect(result.key).toBe('greetings.earlyMorning');
      expect(result.icon).toBe('sunny-outline');
    });

    it('should return earlyMorning greeting at 5:30', () => {
      const result = getGreeting(createDate(5, 30));
      expect(result.type).toBe('earlyMorning');
    });

    it('should return earlyMorning greeting at 5:59', () => {
      const result = getGreeting(createDate(5, 59));
      expect(result.type).toBe('earlyMorning');
    });
  });

  describe('morning (6:00 - 12:00)', () => {
    it('should return morning greeting at 6:00', () => {
      const result = getGreeting(createDate(6, 0));
      expect(result.type).toBe('morning');
      expect(result.key).toBe('greetings.morning');
      expect(result.icon).toBe('sunny');
    });

    it('should return morning greeting at 9:00', () => {
      const result = getGreeting(createDate(9, 0));
      expect(result.type).toBe('morning');
    });

    it('should return morning greeting at 11:59', () => {
      const result = getGreeting(createDate(11, 59));
      expect(result.type).toBe('morning');
    });
  });

  describe('afternoon (12:00 - 17:00)', () => {
    it('should return afternoon greeting at 12:00', () => {
      const result = getGreeting(createDate(12, 0));
      expect(result.type).toBe('afternoon');
      expect(result.key).toBe('greetings.afternoon');
      expect(result.icon).toBe('partly-sunny');
    });

    it('should return afternoon greeting at 14:30', () => {
      const result = getGreeting(createDate(14, 30));
      expect(result.type).toBe('afternoon');
    });

    it('should return afternoon greeting at 16:59', () => {
      const result = getGreeting(createDate(16, 59));
      expect(result.type).toBe('afternoon');
    });
  });

  describe('evening (17:00 - 21:00)', () => {
    it('should return evening greeting at 17:00', () => {
      const result = getGreeting(createDate(17, 0));
      expect(result.type).toBe('evening');
      expect(result.key).toBe('greetings.evening');
      expect(result.icon).toBe('moon-outline');
    });

    it('should return evening greeting at 19:00', () => {
      const result = getGreeting(createDate(19, 0));
      expect(result.type).toBe('evening');
    });

    it('should return evening greeting at 20:59', () => {
      const result = getGreeting(createDate(20, 59));
      expect(result.type).toBe('evening');
    });
  });

  describe('night (21:00 - 4:00)', () => {
    it('should return night greeting at 21:00', () => {
      const result = getGreeting(createDate(21, 0));
      expect(result.type).toBe('night');
      expect(result.key).toBe('greetings.night');
      expect(result.icon).toBe('moon');
    });

    it('should return night greeting at 23:00', () => {
      const result = getGreeting(createDate(23, 0));
      expect(result.type).toBe('night');
    });

    it('should return night greeting at 0:00 (midnight)', () => {
      const result = getGreeting(createDate(0, 0));
      expect(result.type).toBe('night');
    });

    it('should return night greeting at 3:59', () => {
      const result = getGreeting(createDate(3, 59));
      expect(result.type).toBe('night');
    });
  });

  describe('default behavior', () => {
    it('should use current date when no date provided', () => {
      const result = getGreeting();
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('key');
      expect(result).toHaveProperty('icon');
    });
  });
});

describe('getMotivationalMessage', () => {
  const createDate = (hour: number): Date => {
    const date = new Date(2024, 0, 15);
    date.setHours(hour, 0, 0, 0);
    return date;
  };

  it('should return earlyMorning motivational message key', () => {
    const result = getMotivationalMessage(createDate(5));
    expect(result).toBe('greetings.motivation.earlyMorning');
  });

  it('should return morning motivational message key', () => {
    const result = getMotivationalMessage(createDate(9));
    expect(result).toBe('greetings.motivation.morning');
  });

  it('should return afternoon motivational message key', () => {
    const result = getMotivationalMessage(createDate(14));
    expect(result).toBe('greetings.motivation.afternoon');
  });

  it('should return evening motivational message key', () => {
    const result = getMotivationalMessage(createDate(19));
    expect(result).toBe('greetings.motivation.evening');
  });

  it('should return night motivational message key', () => {
    const result = getMotivationalMessage(createDate(23));
    expect(result).toBe('greetings.motivation.night');
  });

  it('should use current date when no date provided', () => {
    const result = getMotivationalMessage();
    expect(result).toMatch(/^greetings\.motivation\./);
  });
});

describe('isNightShift', () => {
  const createDate = (hour: number): Date => {
    const date = new Date(2024, 0, 15);
    date.setHours(hour, 0, 0, 0);
    return date;
  };

  describe('night shift hours (21:00 - 6:00)', () => {
    it('should return true at 21:00', () => {
      expect(isNightShift(createDate(21))).toBe(true);
    });

    it('should return true at 23:00', () => {
      expect(isNightShift(createDate(23))).toBe(true);
    });

    it('should return true at midnight (0:00)', () => {
      expect(isNightShift(createDate(0))).toBe(true);
    });

    it('should return true at 3:00', () => {
      expect(isNightShift(createDate(3))).toBe(true);
    });

    it('should return true at 5:59', () => {
      const date = new Date(2024, 0, 15);
      date.setHours(5, 59, 0, 0);
      expect(isNightShift(date)).toBe(true);
    });
  });

  describe('day hours (6:00 - 21:00)', () => {
    it('should return false at 6:00', () => {
      expect(isNightShift(createDate(6))).toBe(false);
    });

    it('should return false at 12:00', () => {
      expect(isNightShift(createDate(12))).toBe(false);
    });

    it('should return false at 18:00', () => {
      expect(isNightShift(createDate(18))).toBe(false);
    });

    it('should return false at 20:59', () => {
      const date = new Date(2024, 0, 15);
      date.setHours(20, 59, 0, 0);
      expect(isNightShift(date)).toBe(false);
    });
  });

  it('should use current date when no date provided', () => {
    const result = isNightShift();
    expect(typeof result).toBe('boolean');
  });
});

describe('getDayContext', () => {
  const createDate = (dayOfWeek: number): Date => {
    // January 2024 calendar: Mon=1, Tue=2, ..., Sun=7
    // We need to create dates that fall on specific days
    const baseDate = new Date(2024, 0, 1); // Monday Jan 1, 2024
    const daysToAdd = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    baseDate.setDate(1 + daysToAdd);
    return baseDate;
  };

  describe('weekends', () => {
    it('should return weekend key for Sunday (day 0)', () => {
      const sunday = new Date(2024, 0, 7); // Sunday
      expect(getDayContext(sunday)).toBe('greetings.weekend');
    });

    it('should return weekend key for Saturday (day 6)', () => {
      const saturday = new Date(2024, 0, 6); // Saturday
      expect(getDayContext(saturday)).toBe('greetings.weekend');
    });
  });

  describe('special weekdays', () => {
    it('should return monday key for Monday (day 1)', () => {
      const monday = new Date(2024, 0, 1); // Monday
      expect(getDayContext(monday)).toBe('greetings.monday');
    });

    it('should return friday key for Friday (day 5)', () => {
      const friday = new Date(2024, 0, 5); // Friday
      expect(getDayContext(friday)).toBe('greetings.friday');
    });
  });

  describe('regular weekdays', () => {
    it('should return null for Tuesday (day 2)', () => {
      const tuesday = new Date(2024, 0, 2); // Tuesday
      expect(getDayContext(tuesday)).toBeNull();
    });

    it('should return null for Wednesday (day 3)', () => {
      const wednesday = new Date(2024, 0, 3); // Wednesday
      expect(getDayContext(wednesday)).toBeNull();
    });

    it('should return null for Thursday (day 4)', () => {
      const thursday = new Date(2024, 0, 4); // Thursday
      expect(getDayContext(thursday)).toBeNull();
    });
  });

  it('should use current date when no date provided', () => {
    const result = getDayContext();
    expect(result === null || typeof result === 'string').toBe(true);
  });
});
