import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../utils/theme';

interface Props {
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
  testIDPrefix: string;
  single?: boolean;
}

export default function ChipSelector({ options, selected, onToggle, testIDPrefix, single }: Props) {
  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const active = single ? selected[0] === option : selected.includes(option);
        return (
          <TouchableOpacity
            key={option}
            testID={`${testIDPrefix}-${option.toLowerCase().replace(/[\s']/g, '-')}`}
            style={[styles.chip, active && styles.chipOn]}
            onPress={() => onToggle(option)}
            activeOpacity={0.7}
          >
            <Text style={[styles.label, active && styles.labelOn]}>{option}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipOn: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary + '30',
  },
  label: { fontSize: 13, fontWeight: '500', color: Colors.textMuted },
  labelOn: { color: Colors.primary, fontWeight: '600' },
});
