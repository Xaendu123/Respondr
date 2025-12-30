/**
 * THEMED SELECT COMPONENT
 * 
 * Select/dropdown component using theme tokens.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { Text } from './Text';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  label?: string;
  value?: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export function Select({ 
  label, 
  value, 
  options, 
  onValueChange, 
  placeholder,
  error 
}: SelectProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedOption = options.find(opt => opt.value === value);
  
  return (
    <View style={styles.container}>
      {label && (
        <Text variant="label" color="textPrimary" style={styles.label}>
          {label}
        </Text>
      )}
      <TouchableOpacity
        style={[
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.error : theme.colors.border,
            borderWidth: 1,
            borderRadius: theme.borderRadius.md,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }, 
        ]}
        onPress={() => setIsOpen(true)}
      >
        <Text 
          variant="body" 
          color={selectedOption || value ? 'textPrimary' : 'textTertiary'}
          style={selectedOption || value ? { fontWeight: '600' } : undefined}
        >
          {selectedOption ? selectedOption.label : (value || placeholder)}
        </Text>
        <Ionicons 
          name="chevron-down" 
          size={20} 
          color={theme.colors.textSecondary} 
        />
      </TouchableOpacity>
      {error && (
        <Text variant="caption" color="error" style={styles.error}>
          {error}
        </Text>
      )}
      
      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.surface,
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    {
                      backgroundColor: 
                        item.value === value 
                          ? theme.colors.primary 
                          : 'transparent',
                    },
                  ]}
                  onPress={() => {
                    onValueChange(item.value);
                    setIsOpen(false);
                  }}
                >
                  <Text 
                    variant="body" 
                    color={item.value === value ? 'textInverse' : 'textPrimary'}
                    style={item.value === value ? { fontWeight: '600' } : undefined}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Ionicons 
                      name="checkmark-circle" 
                      size={24} 
                      color={theme.colors.onPrimary} 
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  error: {
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
    paddingTop: 16,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

