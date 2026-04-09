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
  label?: string;
  hint?: string;
}

export default function NumberStepper({ value, onIncrement, onDecrement, min = 0, max = 20, testID, label, hint }: Props) {
  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <View style={styles.row}>
      {label && (
        <View style={styles.meta}>
          <Text style={styles.label}>{label}</Text>
          {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        </View>
      )}
      <View style={styles.control}>
        <TouchableOpacity
          testID={`${testID}-decrement`}
          style={[styles.btn, atMin && styles.btnOff]}
          onPress={onDecrement}
          disabled={atMin}
          activeOpacity={0.6}
        >
          <Text style={[styles.btnIcon, atMin && styles.btnIconOff]}>-</Text>
        </TouchableOpacity>
        <Text testID={`${testID}-value`} style={styles.value}>{value}</Text>
        <TouchableOpacity
          testID={`${testID}-increment`}
          style={[styles.btn, atMax && styles.btnOff]}
          onPress={onIncrement}
          disabled={atMax}
          activeOpacity={0.6}
        >
          <Text style={[styles.btnIcon, atMax && styles.btnIconOff]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  meta: { flex: 1 },
  label: { fontSize: 15, fontWeight: '600', color: Colors.textMain },
  hint: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 12,
    padding: 3,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOff: { backgroundColor: 'transparent', opacity: 0.35 },
  btnIcon: { fontSize: 18, fontWeight: '600', color: Colors.textMain },
  btnIconOff: { color: Colors.textMuted },
  value: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textMain,
    minWidth: 32,
    textAlign: 'center',
  },
});
