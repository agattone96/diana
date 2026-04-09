import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../utils/theme';

interface Props {
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
  testIDPrefix: string;
}

export default function ChipSelector({ options, selected, onToggle, testIDPrefix }: Props) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <TouchableOpacity
            key={option}
            testID={`${testIDPrefix}-${option.toLowerCase().replace(/[\s']/g, '-')}`}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onToggle(option)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.surfaceMuted,
  },
  chipSelected: { backgroundColor: Colors.primary },
  chipText: { fontSize: 14, color: Colors.textMuted, fontWeight: '500' },
  chipTextSelected: { color: '#FFFFFF' },
});
