import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../utils/theme';

interface Props {
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
  testIDPrefix: string;
}

export default function CompactChipSelector({ options, selected, onToggle, testIDPrefix }: Props) {
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
            {isSelected && <View style={styles.dot} />}
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
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary + '12',
    borderColor: Colors.primary + '40',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 6,
  },
  chipText: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  chipTextSelected: { color: Colors.primary, fontWeight: '600' },
});
