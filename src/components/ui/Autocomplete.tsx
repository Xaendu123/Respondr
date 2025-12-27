/**
 * AUTOCOMPLETE COMPONENT
 * 
 * Autocomplete/combobox component for searching and selecting from a list,
 * with support for creating new items if no match is found.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { hapticSelect } from '../../utils/haptics';
import { Input } from './Input';
import { Text } from './Text';

export interface AutocompleteProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelect?: (value: string) => void;
  onFocus?: () => void;
  placeholder?: string;
  data: string[]; // List of suggestions
  maxSuggestions?: number;
  minCharsToSearch?: number; // Minimum characters before showing suggestions
  error?: string;
}

export function Autocomplete({
  label,
  value,
  onChangeText,
  onSelect,
  onFocus,
  placeholder,
  data,
  maxSuggestions = 5,
  minCharsToSearch = 0,
  error,
}: AutocompleteProps) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [filteredData, setFilteredData] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Filter data based on current value
  useEffect(() => {
    if (!isFocused) {
      setFilteredData([]);
      setShowSuggestions(false);
      return;
    }

    // If value is empty or less than minCharsToSearch, show all data (up to maxSuggestions)
    if (value.length < minCharsToSearch) {
      const allData = data.slice(0, maxSuggestions);
      setFilteredData(allData);
      setShowSuggestions(allData.length > 0);
      return;
    }

    // Filter based on value
    const lowerValue = value.toLowerCase();
    const filtered = data
      .filter((item) => item.toLowerCase().includes(lowerValue))
      .slice(0, maxSuggestions);

    setFilteredData(filtered);
    setShowSuggestions(filtered.length > 0);
  }, [value, data, isFocused, minCharsToSearch, maxSuggestions]);

  const handleFocus = () => {
    setIsFocused(true);
    // Call parent onFocus handler if provided
    if (onFocus) {
      onFocus();
    }
    // Show suggestions based on current value
    if (value.length < minCharsToSearch) {
      // Show all suggestions when focused and value is short
      const allData = data.slice(0, maxSuggestions);
      setFilteredData(allData);
      setShowSuggestions(allData.length > 0);
    } else {
      // Filter based on value
      const lowerValue = value.toLowerCase();
      const filtered = data
        .filter((item) => item.toLowerCase().includes(lowerValue))
        .slice(0, maxSuggestions);
      setFilteredData(filtered);
      setShowSuggestions(filtered.length > 0);
    }
  };

  const handleBlur = () => {
    // Delay to allow onPress to fire
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
    }, 200);
  };

  const handleSelect = (selectedValue: string) => {
    hapticSelect();
    onChangeText(selectedValue);
    setShowSuggestions(false);
    setIsFocused(false);
    Keyboard.dismiss();
    if (onSelect) {
      onSelect(selectedValue);
    }
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Input
          label={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          error={error}
        />
        {isFocused && value && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              onChangeText('');
              inputRef.current?.focus();
            }}
          >
            <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {showSuggestions && (
        <View style={styles.suggestionsContainer}>
          {filteredData.length > 0 && (
            <View>
              {filteredData.map((item, index) => (
                <TouchableOpacity
                  key={`${item}-${index}`}
                  style={styles.suggestionItem}
                  onPress={() => handleSelect(item)}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color={theme.colors.primary}
                    style={styles.suggestionIcon}
                  />
                  <Text variant="body" style={styles.suggestionText}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      position: 'relative',
      zIndex: 10,
    },
    inputContainer: {
      position: 'relative',
    },
    clearButton: {
      position: 'absolute',
      right: theme.spacing.md,
      top: '50%',
      transform: [{ translateY: -10 }],
      padding: theme.spacing.xs,
      zIndex: 1,
    },
    suggestionsContainer: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginTop: theme.spacing.xs,
      maxHeight: 200,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      zIndex: 1000,
    },
    suggestionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    suggestionIcon: {
      marginRight: theme.spacing.sm,
    },
    suggestionText: {
      flex: 1,
      color: theme.colors.textPrimary,
    },
  });
}

