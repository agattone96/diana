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
    <View style={styles.wrap}>
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <TouchableOpacity
            key={option}
            testID={`${testIDPrefix}-${option.toLowerCase().replace(/[\s']/g, '-')}`}
            style={[styles.chip, active && styles.chipOn]}
            onPress={() => onToggle(option)}
            activeOpacity={0.7}
          >
            {active && <View style={styles.dot} />}
            <Text style={[styles.label, active && styles.labelOn]}>{option}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipOn: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary + '35',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 6,
  },
  label: { fontSize: 12.5, color: Colors.textMuted, fontWeight: '500' },
  labelOn: { color: Colors.primary, fontWeight: '600' },
});
