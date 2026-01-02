/**
 * Theme Configuration Tests
 */

import {
  themes,
  getTheme,
  getSystemTheme,
  Theme,
  ThemeName,
} from '../../config/theme';
import { tokens } from '../../config/tokens';

describe('Theme Configuration', () => {
  describe('themes object', () => {
    it('should have light theme', () => {
      expect(themes.light).toBeDefined();
    });

    it('should have dark theme', () => {
      expect(themes.dark).toBeDefined();
    });

    it('should only have light and dark themes', () => {
      const themeNames = Object.keys(themes);
      expect(themeNames).toHaveLength(2);
      expect(themeNames).toContain('light');
      expect(themeNames).toContain('dark');
    });
  });

  describe('theme structure', () => {
    const validateTheme = (theme: Theme, themeName: string) => {
      describe(`${themeName} theme`, () => {
        it('should have colors object', () => {
          expect(theme.colors).toBeDefined();
          expect(typeof theme.colors).toBe('object');
        });

        it('should have all required color properties', () => {
          const requiredColors = [
            'primary',
            'primaryDark',
            'primaryLight',
            'onPrimary',
            'gradientStart',
            'gradientEnd',
            'background',
            'backgroundSecondary',
            'surface',
            'surfaceElevated',
            'glassBackground',
            'glassBorder',
            'textPrimary',
            'textSecondary',
            'textTertiary',
            'textInverse',
            'border',
            'divider',
            'error',
            'errorBackground',
            'success',
            'successBackground',
            'warning',
            'warningBackground',
            'info',
            'infoBackground',
            'pressed',
            'disabled',
            'disabledBackground',
          ];

          requiredColors.forEach((color) => {
            expect(theme.colors).toHaveProperty(color);
            expect(typeof (theme.colors as any)[color]).toBe('string');
          });
        });

        it('should have spacing from tokens', () => {
          expect(theme.spacing).toBeDefined();
          expect(theme.spacing).toEqual(tokens.spacing);
        });

        it('should have typography from tokens', () => {
          expect(theme.typography).toBeDefined();
          expect(theme.typography).toEqual(tokens.typography);
        });

        it('should have borderRadius from tokens', () => {
          expect(theme.borderRadius).toBeDefined();
          expect(theme.borderRadius).toEqual(tokens.borderRadius);
        });

        it('should have shadows from tokens', () => {
          expect(theme.shadows).toBeDefined();
          expect(theme.shadows).toEqual(tokens.shadows);
        });

        it('should have animation from tokens', () => {
          expect(theme.animation).toBeDefined();
          expect(theme.animation).toEqual(tokens.animation);
        });
      });
    };

    validateTheme(themes.light, 'light');
    validateTheme(themes.dark, 'dark');
  });

  describe('light theme colors', () => {
    const { colors } = themes.light;

    it('should have white background', () => {
      expect(colors.background).toBe('#ffffff');
    });

    it('should have dark text for contrast', () => {
      expect(colors.textPrimary).toBe('#0f172a');
    });

    it('should have white text inverse', () => {
      expect(colors.textInverse).toBe('#ffffff');
    });

    it('should have Respondr Orange as primary', () => {
      expect(colors.primary).toBe('#f97316');
    });
  });

  describe('dark theme colors', () => {
    const { colors } = themes.dark;

    it('should have dark background', () => {
      expect(colors.background).toBe('#020617');
    });

    it('should have light text for contrast', () => {
      expect(colors.textPrimary).toBe('#f8fafc');
    });

    it('should have dark text inverse', () => {
      expect(colors.textInverse).toBe('#020617');
    });

    it('should have Respondr Orange as primary (same as light)', () => {
      expect(colors.primary).toBe('#f97316');
    });
  });

  describe('semantic colors consistency', () => {
    it('should have same primary color in both themes', () => {
      expect(themes.light.colors.primary).toBe(themes.dark.colors.primary);
    });

    it('should have different backgrounds for light and dark', () => {
      expect(themes.light.colors.background).not.toBe(themes.dark.colors.background);
    });

    it('should have different text colors for light and dark', () => {
      expect(themes.light.colors.textPrimary).not.toBe(themes.dark.colors.textPrimary);
    });
  });

  describe('getTheme', () => {
    it('should return light theme when asked for light', () => {
      const theme = getTheme('light');
      expect(theme).toBe(themes.light);
    });

    it('should return dark theme when asked for dark', () => {
      const theme = getTheme('dark');
      expect(theme).toBe(themes.dark);
    });

    it('should return a complete theme object', () => {
      const theme = getTheme('light');
      expect(theme).toHaveProperty('colors');
      expect(theme).toHaveProperty('spacing');
      expect(theme).toHaveProperty('typography');
      expect(theme).toHaveProperty('borderRadius');
      expect(theme).toHaveProperty('shadows');
      expect(theme).toHaveProperty('animation');
    });

    it('should return same reference each time for same theme', () => {
      const theme1 = getTheme('light');
      const theme2 = getTheme('light');
      expect(theme1).toBe(theme2);
    });
  });

  describe('getSystemTheme', () => {
    it('should return a valid theme name', () => {
      const themeName = getSystemTheme();
      expect(['light', 'dark']).toContain(themeName);
    });

    it('should return light as default (placeholder behavior)', () => {
      // Current implementation returns 'light' as default
      expect(getSystemTheme()).toBe('light');
    });

    it('should return type ThemeName', () => {
      const themeName: ThemeName = getSystemTheme();
      expect(themes[themeName]).toBeDefined();
    });
  });

  describe('color format validation', () => {
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    const rgbaColorRegex = /^rgba\(\d{1,3},\s*\d{1,3},\s*\d{1,3},\s*[\d.]+\)$/;

    const validateColorFormat = (color: string) => {
      return hexColorRegex.test(color) || rgbaColorRegex.test(color);
    };

    it('should have valid hex or rgba colors in light theme', () => {
      Object.entries(themes.light.colors).forEach(([key, value]) => {
        expect(validateColorFormat(value)).toBe(true);
      });
    });

    it('should have valid hex or rgba colors in dark theme', () => {
      Object.entries(themes.dark.colors).forEach(([key, value]) => {
        expect(validateColorFormat(value)).toBe(true);
      });
    });
  });
});
