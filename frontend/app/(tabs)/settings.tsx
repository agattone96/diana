import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../src/utils/theme';
import CompactChipSelector from '../../src/components/CompactChipSelector';
import NumberStepper from '../../src/components/NumberStepper';
import { api } from '../../src/utils/api';

const STORES = ['Walmart', 'Tractor Supply', 'Amazon', "Sam's Club", 'Costco', 'Aldi', 'Target', 'Kroger'];
const MEAL_COVERAGE = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
const COOKING_STYLES = ['Easy meals', 'Crockpot', 'One pan', 'Sheet pan', 'Minimum effort', 'Batch cook', 'Air fryer', 'Instant pot'];
const DIETARY_RULES = ['Gluten free', 'Dairy free', 'Low carb', 'Vegetarian', 'Vegan', 'Keto', 'Nut free', 'Low sodium'];

function Label({ children }: { children: string }) {
  return <Text style={s.fieldLabel}>{children}</Text>;
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
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
      setDirty(false);
    } catch (e) { console.error('Load settings:', e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const mark = () => setDirty(true);
  const toggle = (list: string[], set: (v: string[]) => void, item: string) => {
    set(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
    mark();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateProfile({ adults, children, preferred_stores: stores, meal_coverage: meals, cooking_style: cookingStyle, dietary_rules: dietaryRules, exclusions });
      setDirty(false);
      Alert.alert('Saved', 'Household defaults updated. These will pre-fill every new weekly plan.');
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  const handleReset = () => {
    Alert.alert('Reset to Factory Defaults?', '4 adults, 1 child, all default stores & styles.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: async () => {
        try {
          const p = await api.resetProfile();
          setAdults(p.adults); setChildren(p.children); setStores(p.preferred_stores);
          setMeals(p.meal_coverage); setCookingStyle(p.cooking_style);
          setDietaryRules(p.dietary_rules); setExclusions(p.exclusions); setDirty(false);
        } catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  const handleSaveToHistory = async () => {
    try { await api.saveToHistory(); const h = await api.getHistory(); setHistory(h); Alert.alert('Saved', 'Current week bookmarked.'); }
    catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleDuplicate = (id: string) => {
    Alert.alert('Reuse This Plan?', 'Replaces your current weekly plan.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reuse', onPress: async () => {
        try { await api.duplicateFromHistory(id); Alert.alert('Done', 'Plan loaded.'); }
        catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /><Text style={s.loadHint}>Loading profile...</Text></View></SafeAreaView>;

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scrollInner} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={s.header}>
            <View style={s.headerBadge}><Ionicons name="home" size={20} color={Colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle}>Household Profile</Text>
              <Text style={s.headerHint}>Defaults that pre-fill every weekly plan</Text>
            </View>
            {dirty && <View style={s.dirtyBadge}><Text style={s.dirtyText}>Unsaved</Text></View>}
          </View>

          {/* Card 1 — Household Defaults */}
          <View style={s.card}>
            <View style={s.cardHead}><Ionicons name="people-outline" size={15} color={Colors.primary} /><Text style={s.cardTitle}>Household Defaults</Text></View>
            <View style={s.stepperBlock}>
              <NumberStepper label="Adults" hint="Ages 13+" value={adults} onIncrement={() => { setAdults(a => Math.min(a+1,20)); mark(); }} onDecrement={() => { setAdults(a => Math.max(a-1,1)); mark(); }} min={1} testID="settings-adults" />
            </View>
            <View style={s.stepperBlock}>
              <NumberStepper label="Children" hint="Under 13" value={children} onIncrement={() => { setChildren(c => Math.min(c+1,20)); mark(); }} onDecrement={() => { setChildren(c => Math.max(c-1,0)); mark(); }} min={0} testID="settings-children" />
            </View>
          </View>

          {/* Card 2 — Shopping Defaults */}
          <View style={s.card}>
            <View style={s.cardHead}><Ionicons name="cart-outline" size={15} color={Colors.primary} /><Text style={s.cardTitle}>Shopping Defaults</Text></View>
            <Label>Stores</Label>
            <CompactChipSelector options={STORES} selected={stores} onToggle={(st) => toggle(stores, setStores, st)} testIDPrefix="settings-store" />
            <View style={s.divider} />
            <Label>Meal coverage</Label>
            <CompactChipSelector options={MEAL_COVERAGE} selected={meals} onToggle={(m) => toggle(meals, setMeals, m)} testIDPrefix="settings-meal" />
            <View style={s.divider} />
            <Label>Cooking style</Label>
            <CompactChipSelector options={COOKING_STYLES} selected={cookingStyle} onToggle={(c) => toggle(cookingStyle, setCookingStyle, c)} testIDPrefix="settings-cooking" />
          </View>

          {/* Card 3 — Food Rules */}
          <View style={s.card}>
            <View style={s.cardHead}><Ionicons name="nutrition-outline" size={15} color={Colors.primary} /><Text style={s.cardTitle}>Food Rules</Text></View>
            <Label>Dietary restrictions</Label>
            {dietaryRules.length === 0 && <Text style={s.hintText}>None active — tap to add</Text>}
            <CompactChipSelector options={DIETARY_RULES} selected={dietaryRules} onToggle={(d) => toggle(dietaryRules, setDietaryRules, d)} testIDPrefix="settings-dietary" />
            <View style={s.divider} />
            <Label>Exclusions & dislikes</Label>
            <TextInput testID="settings-exclusions" style={s.textInput} value={exclusions} onChangeText={(t) => { setExclusions(t); mark(); }} placeholder="e.g. mushrooms, cilantro" placeholderTextColor={Colors.textLight} multiline />
          </View>

          {/* Card 4 — Weekly History */}
          <View style={s.card}>
            <View style={s.cardHead}><Ionicons name="time-outline" size={15} color={Colors.primary} /><Text style={s.cardTitle}>Weekly History</Text></View>
            <TouchableOpacity testID="save-history-btn" style={s.bookmarkBtn} onPress={handleSaveToHistory} activeOpacity={0.7}>
              <Ionicons name="bookmark-outline" size={15} color={Colors.primary} />
              <Text style={s.bookmarkText}>Save current week to history</Text>
              <Ionicons name="chevron-forward" size={13} color={Colors.textLight} />
            </TouchableOpacity>
            {history.length === 0 ? (
              <View style={s.emptyHist}>
                <View style={s.emptyIcon}><Ionicons name="albums-outline" size={26} color={Colors.border} /></View>
                <Text style={s.emptyTitle}>No saved weeks</Text>
                <Text style={s.emptyBody}>Generate a plan, then save it here to reuse later.</Text>
              </View>
            ) : history.map((entry: any, idx: number) => {
              const recipes = entry.plan?.selectedRecipes || [];
              const dt = entry.saved_at || entry.created_at;
              return (
                <View key={entry.id} style={[s.histRow, idx === history.length - 1 && { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }]} testID={`history-card-${entry.id}`}>
                  <View style={{ flex: 1 }}>
                    <View style={s.histDateRow}>
                      <Text style={s.histDate}>{new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                      <Text style={s.histAgo}>{timeAgo(dt)}</Text>
                    </View>
                    <View style={s.histMeta}>
                      <Text style={s.histChip}>{recipes.length} meals</Text>
                      {entry.config?.adults != null && <Text style={s.histChip}>{entry.config.adults}A {entry.config.children || 0}C</Text>}
                      {entry.config?.budget != null && <Text style={s.histChip}>${entry.config.budget}</Text>}
                    </View>
                  </View>
                  <TouchableOpacity testID={`duplicate-${entry.id}`} style={s.reuseBtn} onPress={() => handleDuplicate(entry.id)} activeOpacity={0.7}>
                    <Ionicons name="arrow-redo-outline" size={14} color={Colors.primary} />
                    <Text style={s.reuseText}>Reuse</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Actions */}
      <View style={s.actionBar}>
        <TouchableOpacity testID="reset-settings-btn" style={s.resetBtn} onPress={handleReset} activeOpacity={0.7}>
          <Ionicons name="refresh-outline" size={15} color={Colors.danger} />
          <Text style={s.resetText}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="save-settings-btn" style={[s.saveBtn, !dirty && s.saveBtnOff]} onPress={handleSave} disabled={saving || !dirty} activeOpacity={0.8}>
          {saving ? <ActivityIndicator size="small" color="#FFF" /> : (
            <><Ionicons name="checkmark-circle-outline" size={17} color="#FFF" /><Text style={s.saveText}>{dirty ? 'Save Defaults' : 'Saved'}</Text></>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadHint: { fontSize: 13, color: Colors.textMuted, marginTop: 8 },
  scrollInner: { padding: 20, paddingTop: 12 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  headerBadge: { width: 42, height: 42, borderRadius: 12, backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 21, fontWeight: '700', color: Colors.textMain, letterSpacing: -0.3 },
  headerHint: { fontSize: 12.5, color: Colors.textMuted, marginTop: 2 },
  dirtyBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6, backgroundColor: Colors.warning + '20' },
  dirtyText: { fontSize: 10, fontWeight: '700', color: Colors.warning, textTransform: 'uppercase', letterSpacing: 0.5 },

  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textMain },

  fieldLabel: { fontSize: 10.5, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 },
  hintText: { fontSize: 12, color: Colors.textLight, fontStyle: 'italic', marginBottom: 6 },
  stepperBlock: { marginBottom: 10 },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 14 },
  textInput: { backgroundColor: Colors.surfaceMuted, borderRadius: 10, padding: 14, fontSize: 14, color: Colors.textMain, minHeight: 44, textAlignVertical: 'top' },

  bookmarkBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 11, paddingHorizontal: 12, backgroundColor: Colors.primaryMuted, borderRadius: 10, marginBottom: 14 },
  bookmarkText: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.primary },

  emptyHist: { alignItems: 'center', paddingVertical: 20 },
  emptyIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  emptyBody: { fontSize: 12, color: Colors.textLight, textAlign: 'center', marginTop: 4, lineHeight: 17, maxWidth: 220 },

  histRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: 12, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  histDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  histDate: { fontSize: 14, fontWeight: '700', color: Colors.textMain },
  histAgo: { fontSize: 10, fontWeight: '600', color: Colors.textLight, backgroundColor: Colors.surfaceMuted, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  histMeta: { flexDirection: 'row', gap: 5 },
  histChip: { fontSize: 11, color: Colors.textMuted, backgroundColor: Colors.background, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  reuseBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.primaryMuted },
  reuseText: { fontSize: 12, fontWeight: '700', color: Colors.primary },

  actionBar: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 28 : 10, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 12, backgroundColor: Colors.dangerMuted, borderWidth: 1, borderColor: Colors.danger + '20' },
  resetText: { fontSize: 13, fontWeight: '600', color: Colors.danger },
  saveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 12, backgroundColor: Colors.primary },
  saveBtnOff: { opacity: 0.5 },
  saveText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});
