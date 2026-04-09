import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CompactChipSelector from '../../src/components/CompactChipSelector';
import NumberStepper from '../../src/components/NumberStepper';
import { useAppSession } from '../../src/context/AppSessionContext';
import {
  DEFAULT_COOKING_STYLES,
  DEFAULT_DIETARY_RULES,
  DEFAULT_MEAL_COVERAGE,
  DEFAULT_STORES,
} from '../../src/data/options';
import { useResponsive } from '../../src/hooks/useResponsive';
import { api } from '../../src/utils/api';
import { Colors, Shadows } from '../../src/utils/theme';

function Label({ children }: { children: string }) {
  return <Text style={s.label}>{children}</Text>;
}

function timeAgo(d: string): string {
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 60) return m <= 1 ? 'Just now' : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const dy = Math.floor(h / 24);
  return dy < 7 ? `${dy}d ago` : `${Math.floor(dy / 7)}w ago`;
}

export default function Settings() {
  const { refreshProfile, setProfile, profile } = useAppSession();
  const { contentMaxWidth, columns, gutter } = useResponsive();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [name, setName] = useState(profile?.name || '');
  const [adults, setAdults] = useState(profile?.adults ?? 4);
  const [children, setChildren] = useState(profile?.children ?? 0);
  const [stores, setStores] = useState<string[]>([]);
  const [meals, setMeals] = useState<string[]>([]);
  const [cookingStyle, setCookingStyle] = useState<string[]>([]);
  const [dietaryRules, setDietaryRules] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState('');
  const [instructions, setInstructions] = useState('');
  const [customStores, setCustomStores] = useState<string[]>([]);
  const [customMeals, setCustomMeals] = useState<string[]>([]);
  const [customCooking, setCustomCooking] = useState<string[]>([]);
  const [customDietary, setCustomDietary] = useState<string[]>([]);
  const [reusableExclusions, setReusableExclusions] = useState<string[]>([]);
  const [storeInput, setStoreInput] = useState('');
  const [mealInput, setMealInput] = useState('');
  const [cookingInput, setCookingInput] = useState('');
  const [dietaryInput, setDietaryInput] = useState('');
  const [exclusionInput, setExclusionInput] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [nextProfile, hist] = await Promise.all([api.getProfile(), api.getHistory()]);
      setProfile(nextProfile);
      setName(nextProfile.name || '');
      setAdults(nextProfile.adults ?? 4);
      setChildren(nextProfile.children ?? 0);
      setStores(nextProfile.preferred_stores || []);
      setMeals(nextProfile.meal_coverage || []);
      setCookingStyle(nextProfile.cooking_style || []);
      setDietaryRules(nextProfile.dietary_rules || []);
      setExclusions(nextProfile.exclusions || '');
      setInstructions(nextProfile.reusable_planning_instructions || '');
      setCustomStores(nextProfile.custom_store_options || []);
      setCustomMeals(nextProfile.custom_meal_coverage_options || []);
      setCustomCooking(nextProfile.custom_cooking_style_options || []);
      setCustomDietary(nextProfile.custom_dietary_tags || []);
      setReusableExclusions(nextProfile.reusable_exclusions || []);
      setHistory(hist || []);
      setDirty(false);
    } catch (e) {
      console.error('Load settings', e);
    } finally {
      setLoading(false);
    }
  }, [setProfile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const allStores = useMemo(() => [...DEFAULT_STORES, ...customStores], [customStores]);
  const allMeals = useMemo(() => [...DEFAULT_MEAL_COVERAGE, ...customMeals], [customMeals]);
  const allCookingStyles = useMemo(() => [...DEFAULT_COOKING_STYLES, ...customCooking], [customCooking]);
  const allDietary = useMemo(() => [...DEFAULT_DIETARY_RULES, ...customDietary], [customDietary]);

  const mark = () => setDirty(true);
  const toggle = (list: string[], setter: (v: string[]) => void, item: string) => {
    setter(list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item]);
    mark();
  };

  const addOption = (value: string, current: string[], setter: (v: string[]) => void) => {
    const clean = value.trim();
    if (!clean || current.includes(clean)) return;
    setter([...current, clean]);
    mark();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.updateProfile({
        name,
        adults,
        children,
        preferred_stores: stores,
        meal_coverage: meals,
        cooking_style: cookingStyle,
        dietary_rules: dietaryRules,
        exclusions,
        reusable_planning_instructions: instructions,
        custom_store_options: customStores,
        custom_meal_coverage_options: customMeals,
        custom_cooking_style_options: customCooking,
        custom_dietary_tags: customDietary,
        reusable_exclusions: reusableExclusions,
      });
      setProfile(updated);
      setDirty(false);
      Alert.alert('Saved', 'Household defaults updated.');
    } catch (e: any) {
      Alert.alert('Save failed', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      const reset = await api.resetProfile();
      setProfile(reset);
      await refreshProfile();
      loadData();
    } catch (e: any) {
      Alert.alert('Reset failed', e.message);
    }
  };

  const handleSaveHistory = async () => {
    try {
      await api.saveToHistory();
      const hist = await api.getHistory();
      setHistory(hist);
    } catch (e: any) {
      Alert.alert('Could not save week', e.message);
    }
  };

  const handleReuse = async (id: string) => {
    try {
      await api.duplicateFromHistory(id);
      Alert.alert('Copied', 'Saved week copied back into the active planner.');
    } catch (e: any) {
      Alert.alert('Could not reuse', e.message);
    }
  };

  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View></SafeAreaView>;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={{ padding: gutter }}>
        <View style={[s.wrap, { maxWidth: contentMaxWidth }]}>
          <View style={s.header}>
            <Text style={s.title}>Settings</Text>
            <Text style={s.subtitle}>Saved household defaults, reusable options, and weekly history.</Text>
          </View>

          <View style={[s.grid, columns === 2 && s.gridDesktop]}>
            <View style={s.column}>
              <View style={s.card}>
                <Text style={s.cardTitle}>Household Defaults</Text>
                <Text style={s.cardSubtitle}>People count and baseline household details.</Text>
                <Label>Household name</Label>
                <TextInput style={s.input} value={name} onChangeText={(value) => { setName(value); mark(); }} placeholder="Household name" placeholderTextColor={Colors.textLight} />
                <View style={columns === 2 ? s.stepperRow : undefined}>
                  <View style={s.stepperCell}><NumberStepper value={adults} onIncrement={() => { setAdults((v) => v + 1); mark(); }} onDecrement={() => { setAdults((v) => Math.max(1, v - 1)); mark(); }} testID="settings-adults" label="Adults" /></View>
                  <View style={s.stepperCell}><NumberStepper value={children} onIncrement={() => { setChildren((v) => v + 1); mark(); }} onDecrement={() => { setChildren((v) => Math.max(0, v - 1)); mark(); }} testID="settings-children" label="Children" /></View>
                </View>
              </View>

              <View style={s.card}>
                <Text style={s.cardTitle}>Shopping Defaults</Text>
                <Text style={s.cardSubtitle}>Default stores, meal coverage, and cooking style.</Text>
                <Label>Stores</Label>
                <CompactChipSelector options={allStores} selected={stores} onToggle={(item) => toggle(stores, setStores, item)} testIDPrefix="settings-store" />
                <View style={s.addRow}><TextInput style={s.inlineInput} value={storeInput} onChangeText={setStoreInput} placeholder="Add custom store" placeholderTextColor={Colors.textLight} /><TouchableOpacity style={s.addBtn} onPress={() => { addOption(storeInput, customStores, setCustomStores); setStoreInput(''); }}><Text style={s.addBtnText}>Add</Text></TouchableOpacity></View>

                <Label>Meal coverage</Label>
                <CompactChipSelector options={allMeals} selected={meals} onToggle={(item) => toggle(meals, setMeals, item)} testIDPrefix="settings-meal" />
                <View style={s.addRow}><TextInput style={s.inlineInput} value={mealInput} onChangeText={setMealInput} placeholder="Add meal coverage" placeholderTextColor={Colors.textLight} /><TouchableOpacity style={s.addBtn} onPress={() => { addOption(mealInput, customMeals, setCustomMeals); setMealInput(''); }}><Text style={s.addBtnText}>Add</Text></TouchableOpacity></View>

                <Label>Cooking style</Label>
                <CompactChipSelector options={allCookingStyles} selected={cookingStyle} onToggle={(item) => toggle(cookingStyle, setCookingStyle, item)} testIDPrefix="settings-cooking" />
                <View style={s.addRow}><TextInput style={s.inlineInput} value={cookingInput} onChangeText={setCookingInput} placeholder="Add cooking style" placeholderTextColor={Colors.textLight} /><TouchableOpacity style={s.addBtn} onPress={() => { addOption(cookingInput, customCooking, setCustomCooking); setCookingInput(''); }}><Text style={s.addBtnText}>Add</Text></TouchableOpacity></View>
              </View>
            </View>

            <View style={s.column}>
              <View style={s.card}>
                <Text style={s.cardTitle}>Food Rules</Text>
                <Text style={s.cardSubtitle}>Dietary defaults, exclusions, and reusable planning instructions.</Text>
                <Label>Dietary defaults</Label>
                <CompactChipSelector options={allDietary} selected={dietaryRules} onToggle={(item) => toggle(dietaryRules, setDietaryRules, item)} testIDPrefix="settings-dietary" />
                <View style={s.addRow}><TextInput style={s.inlineInput} value={dietaryInput} onChangeText={setDietaryInput} placeholder="Add dietary tag" placeholderTextColor={Colors.textLight} /><TouchableOpacity style={s.addBtn} onPress={() => { addOption(dietaryInput, customDietary, setCustomDietary); setDietaryInput(''); }}><Text style={s.addBtnText}>Add</Text></TouchableOpacity></View>

                <Label>Reusable exclusions</Label>
                <View style={s.addRow}><TextInput style={s.inlineInput} value={exclusionInput} onChangeText={setExclusionInput} placeholder="Add exclusion" placeholderTextColor={Colors.textLight} /><TouchableOpacity style={s.addBtn} onPress={() => { addOption(exclusionInput, reusableExclusions, setReusableExclusions); setExclusionInput(''); }}><Text style={s.addBtnText}>Add</Text></TouchableOpacity></View>
                {!!reusableExclusions.length && (
                  <View style={s.savedRow}>
                    {reusableExclusions.map((item) => (
                      <View key={item} style={s.savedChip}><Text style={s.savedChipText}>{item}</Text></View>
                    ))}
                  </View>
                )}

                <Label>Exclusions</Label>
                <TextInput style={s.textArea} multiline value={exclusions} onChangeText={(value) => { setExclusions(value); mark(); }} placeholder="Household exclusions and recurring avoids" placeholderTextColor={Colors.textLight} />
                <Label>Reusable planning instructions</Label>
                <TextInput style={s.textArea} multiline value={instructions} onChangeText={(value) => { setInstructions(value); mark(); }} placeholder="Default notes for future AI planning" placeholderTextColor={Colors.textLight} />
              </View>

              <View style={s.card}>
                <Text style={s.cardTitle}>Weekly History</Text>
                <Text style={s.cardSubtitle}>Save and reuse weekly plans.</Text>
                <TouchableOpacity style={s.historySaveBtn} onPress={handleSaveHistory}>
                  <Ionicons name="bookmark-outline" size={16} color={Colors.primary} />
                  <Text style={s.historySaveText}>Save current week to history</Text>
                </TouchableOpacity>

                {!history.length ? (
                  <View style={s.emptyState}>
                    <Text style={s.emptyTitle}>No saved weeks yet</Text>
                    <Text style={s.emptyBody}>When you save a week, it will appear here for reuse.</Text>
                  </View>
                ) : history.map((item) => (
                  <View key={item.id} style={s.histRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.histDate}>{new Date(item.saved_at || item.created_at).toLocaleDateString()}</Text>
                      <Text style={s.histAgo}>{timeAgo(item.saved_at || item.created_at)}</Text>
                    </View>
                    <TouchableOpacity style={s.reuseBtn} onPress={() => handleReuse(item.id)}>
                      <Text style={s.reuseText}>Reuse</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={s.actionBar}>
        <TouchableOpacity style={s.resetBtn} onPress={handleReset}>
          <Text style={s.resetText}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.saveBtn, (!dirty || saving) && s.saveBtnOff]} onPress={handleSave} disabled={!dirty || saving}>
          <Text style={s.saveText}>{saving ? 'Saving...' : 'Save Defaults'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  wrap: { width: '100%', alignSelf: 'center', paddingBottom: 120, gap: 16 },
  header: { gap: 8 },
  title: { fontSize: 32, fontWeight: '800', color: Colors.textMain },
  subtitle: { fontSize: 15, lineHeight: 22, color: Colors.textMuted, maxWidth: 760 },
  grid: { gap: 16 },
  gridDesktop: { flexDirection: 'row', alignItems: 'flex-start' },
  column: { flex: 1, gap: 16 },
  card: { backgroundColor: Colors.surface, borderRadius: 22, padding: 20, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  cardTitle: { fontSize: 18, fontWeight: '800', color: Colors.textMain },
  cardSubtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 4, marginBottom: 14, lineHeight: 19 },
  label: { fontSize: 11, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 14, marginBottom: 10 },
  input: { backgroundColor: Colors.surfaceMuted, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: Colors.textMain, fontSize: 14 },
  textArea: { minHeight: 88, backgroundColor: Colors.surfaceMuted, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: Colors.textMain, fontSize: 14, textAlignVertical: 'top' },
  stepperRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
  stepperCell: { flex: 1 },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  inlineInput: { flex: 1, backgroundColor: Colors.surfaceMuted, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: Colors.textMain, fontSize: 14 },
  addBtn: { backgroundColor: Colors.primary, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 16 },
  addBtnText: { color: '#FFF', fontWeight: '700' },
  savedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  savedChip: { backgroundColor: Colors.primaryMuted, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  savedChipText: { color: Colors.primary, fontSize: 12, fontWeight: '700' },
  historySaveBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primaryLight, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  historySaveText: { color: Colors.primary, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 24 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: Colors.textMuted },
  emptyBody: { fontSize: 13, color: Colors.textLight, marginTop: 6, textAlign: 'center', lineHeight: 19, maxWidth: 260 },
  histRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  histDate: { fontSize: 14, fontWeight: '700', color: Colors.textMain },
  histAgo: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  reuseBtn: { backgroundColor: Colors.surfaceMuted, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  reuseText: { color: Colors.primary, fontWeight: '700' },
  actionBar: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.borderLight, backgroundColor: Colors.surface },
  resetBtn: { borderRadius: 14, paddingHorizontal: 18, justifyContent: 'center', backgroundColor: Colors.dangerMuted },
  resetText: { color: Colors.danger, fontWeight: '700' },
  saveBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: 14, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  saveBtnOff: { opacity: 0.45 },
  saveText: { color: '#FFF', fontWeight: '800' },
});
