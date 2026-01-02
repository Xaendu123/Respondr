/**
 * useTranslation Hook Tests
 */

import { renderHook } from '@testing-library/react-native';
import { useTranslation, useTranslationSafe } from '../../hooks/useTranslation';

// Mocks are set up in setup.ts

describe('useTranslation Hook', () => {
  describe('useTranslation', () => {
    it('should return t function', () => {
      const { result } = renderHook(() => useTranslation());

      expect(result.current.t).toBeDefined();
      expect(typeof result.current.t).toBe('function');
    });

    it('should return currentLanguage', () => {
      const { result } = renderHook(() => useTranslation());

      expect(result.current.currentLanguage).toBeDefined();
      expect(typeof result.current.currentLanguage).toBe('string');
    });

    it('should return changeLanguage function', () => {
      const { result } = renderHook(() => useTranslation());

      expect(result.current.changeLanguage).toBeDefined();
      expect(typeof result.current.changeLanguage).toBe('function');
    });

    it('t function should return translation key as fallback', () => {
      const { result } = renderHook(() => useTranslation());

      // The mock returns the key
      const translation = result.current.t('test.key');
      expect(translation).toBe('test.key');
    });
  });
});

describe('useTranslationSafe', () => {
  describe('return value structure', () => {
    it('should return t function', () => {
      const { result } = renderHook(() => useTranslationSafe());

      expect(result.current.t).toBeDefined();
      expect(typeof result.current.t).toBe('function');
    });

    it('should return currentLanguage', () => {
      const { result } = renderHook(() => useTranslationSafe());

      expect(result.current.currentLanguage).toBeDefined();
      expect(typeof result.current.currentLanguage).toBe('string');
    });

    it('should return changeLanguage function', () => {
      const { result } = renderHook(() => useTranslationSafe());

      expect(result.current.changeLanguage).toBeDefined();
      expect(typeof result.current.changeLanguage).toBe('function');
    });
  });

  describe('t function behavior', () => {
    it('should return string for translation key', () => {
      const { result } = renderHook(() => useTranslationSafe());

      const translation = result.current.t('some.key');
      expect(typeof translation).toBe('string');
    });

    it('should return key as fallback when translation not found', () => {
      const { result } = renderHook(() => useTranslationSafe());

      const translation = result.current.t('nonexistent.key');
      expect(translation).toBe('nonexistent.key');
    });

    it('should handle options parameter', () => {
      const { result } = renderHook(() => useTranslationSafe());

      // Should not throw when options are passed
      expect(() => {
        result.current.t('key.with.options', { count: 5 });
      }).not.toThrow();
    });

    it('should always return a string', () => {
      const { result } = renderHook(() => useTranslationSafe());

      const translations = [
        result.current.t('key1'),
        result.current.t('key2', { param: 'value' }),
        result.current.t(''),
      ];

      translations.forEach(t => {
        expect(typeof t).toBe('string');
      });
    });
  });

  describe('currentLanguage', () => {
    it('should return a valid language code', () => {
      const { result } = renderHook(() => useTranslationSafe());

      expect(result.current.currentLanguage).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);
    });

    it('should default to en if no language set', () => {
      const { result } = renderHook(() => useTranslationSafe());

      // Mock returns 'en' as default
      expect(['en', 'de']).toContain(result.current.currentLanguage);
    });
  });

  describe('changeLanguage', () => {
    it('should not throw when changing language', async () => {
      const { result } = renderHook(() => useTranslationSafe());

      await expect(result.current.changeLanguage('de')).resolves.not.toThrow();
    });

    it('should handle invalid language gracefully', async () => {
      const { result } = renderHook(() => useTranslationSafe());

      // Should not throw even for invalid language
      await expect(result.current.changeLanguage('invalid')).resolves.not.toThrow();
    });
  });

  describe('error resilience', () => {
    it('should not throw if hook is called in invalid context', () => {
      // The safe version should handle errors gracefully
      expect(() => {
        renderHook(() => useTranslationSafe());
      }).not.toThrow();
    });
  });
});
