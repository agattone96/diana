import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/utils/theme';
import ChipSelector from '../../src/components/ChipSelector';
import NumberStepper from '../../src/components/NumberStepper';
import { api } from '../../src/utils/api';

const STORES = ['Walmart', 'Tractor Supply', 'Amazon', "Sam's Club", 'Costco', 'Aldi', 'Target', 'Kroger'];
const MEAL_COVERAGE = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
const COOKING_STYLES = ['Easy meals', 'Crockpot', 'One pan', 'Sheet pan', 'Minimum effort', 'Batch cook', 'Air fryer', 'Instant pot'];
const DIETARY_RULES = ['Gluten free', 'Dairy free', 'Low carb', 'Vegetarian', 'Vegan', 'Keto', 'Nut free', 'Low sodium'];

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const [adults, setAdults] = useState(4);
  const [children, setChildren] = useState(1);
  const [stores, setStores] = useState<string[]>([]);
  const [meals, setMeals] = useState<string[]>([]);
  const [cookingStyle, setCookingStyle] = useState<string[]>([]);
  const [dietaryRules, setDietaryRules] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [profile, hist] = await Promise.all([api.getProfile(), api.getHistory()]);
      if (profile) {
        setAdults(profile.adults ?? 4);
        setChildren(profile.children ?? 1);
        setStores(profile.preferred_stores || []);
        setMeals(profile.meal_coverage || []);
        setCookingStyle(profile.cooking_style || []);
        setDietaryRules(profile.dietary_rules || []);
        setExclusions(profile.exclusions || '');
      }
      setHistory(hist || []);
    } catch (e) {
      console.error('Load settings failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggle = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateProfile({
        adults, children,
        preferred_stores: stores,
        meal_coverage: meals,
        cooking_style: cookingStyle,
        dietary_rules: dietaryRules,
        exclusions,
      });
      Alert.alert('Saved', 'Your defaults have been updated.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    Alert.alert('Reset Defaults', 'This will restore all settings to the original defaults.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive', onPress: async () => {
          try {
            const profile = await api.resetProfile();
            setAdults(profile.adults);
            setChildren(profile.children);
            setStores(profile.preferred_stores);
            setMeals(profile.meal_coverage);
            setCookingStyle(profile.cooking_style);
            setDietaryRules(profile.dietary_rules);
            setExclusions(profile.exclusions);
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        }
      },
    ]);
  };

  const handleSaveToHistory = async () => {
    try {
      await api.saveToHistory();
      const hist = await api.getHistory();
      setHistory(hist);
      Alert.alert('Saved', 'Current week saved to history.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await api.duplicateFromHistory(id);
      Alert.alert('Done', 'Previous week duplicated as current plan.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your household defaults</Text>

          {/* Household */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>HOUSEHOLD SIZE</Text>
            <View style={styles.card}>
              <View style={styles.stepperRow}>
                <Text style={styles.label}>Adults</Text>
                <NumberStepper value={adults} onIncrement={() => setAdults(a => Math.min(a + 1, 20))} onDecrement={() => setAdults(a => Math.max(a - 1, 1))} min={1} testID="settings-adults" />
              </View>
              <View style={styles.divider} />
              <View style={styles.stepperRow}>
                <Text style={styles.label}>Children</Text>
                <NumberStepper value={children} onIncrement={() => setChildren(c => Math.min(c + 1, 20))} onDecrement={() => setChildren(c => Math.max(c - 1, 0))} min={0} testID="settings-children" />
              </View>
            </View>
          </View>

          {/* Stores */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DEFAULT STORES</Text>
            <ChipSelector options={STORES} selected={stores} onToggle={(s) => toggle(stores, setStores, s)} testIDPrefix="settings-store" />
          </View>

          {/* Meals */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DEFAULT MEAL COVERAGE</Text>
            <ChipSelector options={MEAL_COVERAGE} selected={meals} onToggle={(m) => toggle(meals, setMeals, m)} testIDPrefix="settings-meal" />
          </View>

          {/* Cooking Style */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DEFAULT COOKING STYLE</Text>
            <ChipSelector options={COOKING_STYLES} selected={cookingStyle} onToggle={(c) => toggle(cookingStyle, setCookingStyle, c)} testIDPrefix="settings-cooking" />
          </View>

          {/* Dietary */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DIETARY DEFAULTS</Text>
            <ChipSelector options={DIETARY_RULES} selected={dietaryRules} onToggle={(d) => toggle(dietaryRules, setDietaryRules, d)} testIDPrefix="settings-dietary" />
          </View>

          {/* Exclusions */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>EXCLUSIONS</Text>
            <TextInput
              testID="settings-exclusions"
              style={styles.textInput}
              value={exclusions}
              onChangeText={setExclusions}
              placeholder="e.g. mushrooms, cilantro"
              placeholderTextColor={Colors.textMuted}
              multiline
            />
          </View>

          {/* Save / Reset */}
          <View style={styles.buttonRow}>
            <TouchableOpacity testID="save-settings-btn" style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save Defaults</Text>}
            </TouchableOpacity>
            <TouchableOpacity testID="reset-settings-btn" style={styles.resetBtn} onPress={handleReset}>
              <Text style={styles.resetBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* History */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>WEEKLY HISTORY</Text>
            <TouchableOpacity testID="save-history-btn" style={styles.historyAction} onPress={handleSaveToHistory}>
              <Ionicons name="bookmark-outline" size={18} color={Colors.primary} />
              <Text style={styles.historyActionText}>Save current week to history</Text>
            </TouchableOpacity>
            {history.length === 0 ? (
              <Text style={styles.emptyHistoryText}>No saved weeks yet</Text>
            ) : (
              history.map((entry: any) => (
                <View key={entry.id} style={styles.historyCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyDate}>
                      {new Date(entry.saved_at || entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                    <Text style={styles.historyMeta}>
                      {entry.plan?.selectedRecipes?.length || 0} recipes
                    </Text>
                  </View>
                  <TouchableOpacity testID={`duplicate-${entry.id}`} style={styles.duplicateBtn} onPress={() => handleDuplicate(entry.id)}>
                    <Ionicons name="copy-outline" size={16} color={Colors.primary} />
                    <Text style={styles.duplicateBtnText}>Use</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingTop: 12 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: Colors.textMain },
  headerSubtitle: { fontSize: 15, color: Colors.textMuted, marginTop: 4, marginBottom: 20 },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1.2, marginBottom: 10, textTransform: 'uppercase' },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.border },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 16, fontWeight: '600', color: Colors.textMain },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 16 },
  textInput: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 16, fontSize: 15,
    color: Colors.textMain, borderWidth: 1, borderColor: Colors.border, minHeight: 56, textAlignVertical: 'top',
  },
  buttonRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  saveBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  resetBtn: { paddingHorizontal: 24, paddingVertical: 16, borderRadius: 14, borderWidth: 1, borderColor: Colors.danger, alignItems: 'center' },
  resetBtnText: { fontSize: 16, fontWeight: '600', color: Colors.danger },
  historyAction: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  historyActionText: { fontSize: 15, fontWeight: '600', color: Colors.primary },
  emptyHistoryText: { fontSize: 14, color: Colors.textMuted, fontStyle: 'italic' },
  historyCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  historyDate: { fontSize: 15, fontWeight: '600', color: Colors.textMain },
  historyMeta: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  duplicateBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.surfaceMuted },
  duplicateBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
});
