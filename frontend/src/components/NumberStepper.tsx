import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../utils/theme';

interface Props {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  min?: number;
  max?: number;
  testID: string;
}

export default function NumberStepper({ value, onIncrement, onDecrement, min = 0, max = 20, testID }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        testID={`${testID}-decrement`}
        style={[styles.button, value <= min && styles.buttonDisabled]}
        onPress={onDecrement}
        disabled={value <= min}
        activeOpacity={0.6}
      >
        <Text style={[styles.buttonText, value <= min && styles.buttonTextDisabled]}>-</Text>
      </TouchableOpacity>
      <Text testID={`${testID}-value`} style={styles.value}>{value}</Text>
      <TouchableOpacity
        testID={`${testID}-increment`}
        style={[styles.button, value >= max && styles.buttonDisabled]}
        onPress={onIncrement}
        disabled={value >= max}
        activeOpacity={0.6}
      >
        <Text style={[styles.buttonText, value >= max && styles.buttonTextDisabled]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.3 },
  buttonText: { fontSize: 20, fontWeight: '600', color: Colors.textMain },
  buttonTextDisabled: { color: Colors.textMuted },
  value: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textMain,
    marginHorizontal: 20,
    minWidth: 24,
    textAlign: 'center',
  },
});
