import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/utils/theme';
import CompactChipSelector from '../../src/components/CompactChipSelector';
import NumberStepper from '../../src/components/NumberStepper';
import { api } from '../../src/utils/api';

const STORES = ['Walmart', 'Tractor Supply', 'Amazon', "Sam's Club", 'Costco', 'Aldi', 'Target', 'Kroger'];
const MEAL_COVERAGE = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
const COOKING_STYLES = ['Easy meals', 'Crockpot', 'One pan', 'Sheet pan', 'Minimum effort', 'Batch cook', 'Air fryer', 'Instant pot'];
const DIETARY_RULES = ['Gluten free', 'Dairy free', 'Low carb', 'Vegetarian', 'Vegan', 'Keto', 'Nut free', 'Low sodium'];

function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <View style={s.sectionHeader}>
      <View style={s.sectionIconWrap}>
        <Ionicons name={icon as any} size={16} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.sectionTitle}>{title}</Text>
        <Text style={s.sectionSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <Text style={s.fieldLabel}>{children}</Text>;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? 'Just now' : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
}

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [dirty, setDirty] = useState(false);

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
    } catch (e) {
      console.error('Load settings failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const mark = () => setDirty(true);
  const toggle = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
    mark();
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
      setDirty(false);
      Alert.alert('Defaults Saved', 'Your household profile has been updated. These will pre-fill every new weekly plan.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    Alert.alert(
      'Reset to Factory Defaults?',
      '4 adults, 1 child, all default stores & cooking styles. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything', style: 'destructive', onPress: async () => {
            try {
              const profile = await api.resetProfile();
              setAdults(profile.adults);
              setChildren(profile.children);
              setStores(profile.preferred_stores);
              setMeals(profile.meal_coverage);
              setCookingStyle(profile.cooking_style);
              setDietaryRules(profile.dietary_rules);
              setExclusions(profile.exclusions);
              setDirty(false);
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          }
        },
      ]
    );
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
    Alert.alert('Reuse This Plan?', 'This will replace your current weekly plan with this saved one.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reuse Plan', onPress: async () => {
          try {
            await api.duplicateFromHistory(id);
            Alert.alert('Done', 'Previous week loaded as your current plan.');
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        }
      }
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safeArea}>
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={s.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

          {/* ── Profile Header ── */}
          <View style={s.profileHeader}>
            <View style={s.profileBadge}>
              <Ionicons name="home" size={22} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.profileTitle}>Household Profile</Text>
              <Text style={s.profileHint}>
                Defaults that pre-fill every weekly plan
              </Text>
            </View>
            {dirty && (
              <View style={s.unsavedBadge}>
                <Text style={s.unsavedText}>Unsaved</Text>
              </View>
            )}
          </View>

          {/* ════════════════════════════════════════════ */}
          {/* CARD 1 — Household & Shopping              */}
          {/* ════════════════════════════════════════════ */}
          <View style={s.groupCard}>
            <SectionHeader icon="people-outline" title="Household & Shopping" subtitle="Who you're feeding and where you shop" />

            <FieldLabel>Household size</FieldLabel>
            <View style={s.stepperRow}>
              <View style={s.stepperMeta}>
                <Ionicons name="person-outline" size={16} color={Colors.textMuted} />
                <Text style={s.stepperLabel}>Adults</Text>
              </View>
              <NumberStepper value={adults} onIncrement={() => { setAdults(a => Math.min(a + 1, 20)); mark(); }} onDecrement={() => { setAdults(a => Math.max(a - 1, 1)); mark(); }} min={1} testID="settings-adults" />
            </View>
            <View style={s.stepperRow}>
              <View style={s.stepperMeta}>
                <Ionicons name="happy-outline" size={16} color={Colors.textMuted} />
                <Text style={s.stepperLabel}>Children</Text>
              </View>
              <NumberStepper value={children} onIncrement={() => { setChildren(c => Math.min(c + 1, 20)); mark(); }} onDecrement={() => { setChildren(c => Math.max(c - 1, 0)); mark(); }} min={0} testID="settings-children" />
            </View>

            <View style={s.inCardDivider} />

            <FieldLabel>Preferred stores</FieldLabel>
            <CompactChipSelector options={STORES} selected={stores} onToggle={(st) => toggle(stores, setStores, st)} testIDPrefix="settings-store" />
          </View>

          {/* ════════════════════════════════════════════ */}
          {/* CARD 2 — Food & Cooking Rules              */}
          {/* ════════════════════════════════════════════ */}
          <View style={s.groupCard}>
            <SectionHeader icon="restaurant-outline" title="Food & Cooking Rules" subtitle="Meals, methods, restrictions, and dislikes" />

            <FieldLabel>Meal coverage</FieldLabel>
            <CompactChipSelector options={MEAL_COVERAGE} selected={meals} onToggle={(m) => toggle(meals, setMeals, m)} testIDPrefix="settings-meal" />

            <View style={s.fieldGap} />
            <FieldLabel>Cooking style</FieldLabel>
            <CompactChipSelector options={COOKING_STYLES} selected={cookingStyle} onToggle={(c) => toggle(cookingStyle, setCookingStyle, c)} testIDPrefix="settings-cooking" />

            <View style={s.inCardDivider} />

            <FieldLabel>Dietary restrictions</FieldLabel>
            {dietaryRules.length === 0 && (
              <Text style={s.noneActiveHint}>None active — tap to add</Text>
            )}
            <CompactChipSelector options={DIETARY_RULES} selected={dietaryRules} onToggle={(d) => toggle(dietaryRules, setDietaryRules, d)} testIDPrefix="settings-dietary" />

            <View style={s.fieldGap} />
            <FieldLabel>Exclusions & dislikes</FieldLabel>
            <TextInput
              testID="settings-exclusions"
              style={s.textInput}
              value={exclusions}
              onChangeText={(t) => { setExclusions(t); mark(); }}
              placeholder="e.g. mushrooms, cilantro, shellfish"
              placeholderTextColor={Colors.textMuted}
              multiline
            />
          </View>

          {/* ════════════════════════════════════════════ */}
          {/* CARD 3 — Weekly History                     */}
          {/* ════════════════════════════════════════════ */}
          <View style={s.groupCard}>
            <SectionHeader icon="time-outline" title="Weekly History" subtitle="Past plans you can revisit or reuse" />

            <TouchableOpacity testID="save-history-btn" style={s.bookmarkAction} onPress={handleSaveToHistory} activeOpacity={0.7}>
              <Ionicons name="bookmark-outline" size={16} color={Colors.primary} />
              <Text style={s.bookmarkText}>Save current week to history</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
            </TouchableOpacity>

            {history.length === 0 ? (
              <View style={s.emptyHistory}>
                <View style={s.emptyHistoryIcon}>
                  <Ionicons name="albums-outline" size={28} color={Colors.border} />
                </View>
                <Text style={s.emptyHistoryTitle}>No saved weeks</Text>
                <Text style={s.emptyHistoryBody}>
                  After you generate a plan, save it here to reference or reuse it later.
                </Text>
              </View>
            ) : (
              <View style={s.historyList}>
                {history.map((entry: any, idx: number) => {
                  const recipes = entry.plan?.selectedRecipes || [];
                  const recipeCount = recipes.length;
                  const mealTypes = [...new Set(recipes.map((r: any) => r.mealType).filter(Boolean))];
                  const savedDate = entry.saved_at || entry.created_at;
                  const configBudget = entry.config?.budget;
                  const configAdults = entry.config?.adults;
                  const configChildren = entry.config?.children;

                  return (
                    <View key={entry.id} style={[s.historyCard, idx === history.length - 1 && { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]} testID={`history-card-${entry.id}`}>
                      <View style={s.historyCardLeft}>
                        <View style={s.historyDateRow}>
                          <Text style={s.historyDate}>
                            {new Date(savedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </Text>
                          <View style={s.historyTimeBadge}>
                            <Text style={s.historyTimeText}>{timeAgo(savedDate)}</Text>
                          </View>
                        </View>
                        <View style={s.historyMetaRow}>
                          {recipeCount > 0 && (
                            <View style={s.historyChip}>
                              <Ionicons name="restaurant-outline" size={11} color={Colors.textMuted} />
                              <Text style={s.historyChipText}>{recipeCount} meals</Text>
                            </View>
                          )}
                          {configAdults != null && (
                            <View style={s.historyChip}>
                              <Ionicons name="people-outline" size={11} color={Colors.textMuted} />
                              <Text style={s.historyChipText}>{configAdults}A{configChildren ? ` ${configChildren}C` : ''}</Text>
                            </View>
                          )}
                          {configBudget != null && (
                            <View style={s.historyChip}>
                              <Text style={s.historyChipText}>${configBudget}</Text>
                            </View>
                          )}
                        </View>
                        {mealTypes.length > 0 && (
                          <Text style={s.historyMealTypes} numberOfLines={1}>
                            {recipes.slice(0, 3).map((r: any) => r.name).join(' · ')}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity testID={`duplicate-${entry.id}`} style={s.reuseBtn} onPress={() => handleDuplicate(entry.id)} activeOpacity={0.7}>
                        <Ionicons name="arrow-redo-outline" size={15} color={Colors.primary} />
                        <Text style={s.reuseBtnText}>Reuse</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Sticky Action Bar ── */}
      <View style={s.actionBar}>
        <TouchableOpacity testID="reset-settings-btn" style={s.resetBtn} onPress={handleReset} activeOpacity={0.7}>
          <Ionicons name="refresh-outline" size={16} color={Colors.danger} />
          <Text style={s.resetBtnText}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="save-settings-btn"
          style={[s.saveBtn, !dirty && s.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving || !dirty}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
              <Text style={s.saveBtnText}>{dirty ? 'Save Defaults' : 'Saved'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: Colors.textMuted },
  scrollContent: { padding: 20, paddingTop: 12 },

  /* ── Profile Header ── */
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 12 },
  profileBadge: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.primary + '14',
    alignItems: 'center', justifyContent: 'center',
  },
  profileTitle: { fontSize: 22, fontWeight: '700', color: Colors.textMain, letterSpacing: -0.3 },
  profileHint: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  unsavedBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
    backgroundColor: Colors.warning + '20',
  },
  unsavedText: { fontSize: 11, fontWeight: '700', color: Colors.warning, textTransform: 'uppercase', letterSpacing: 0.5 },

  /* ── Group Card ── */
  groupCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  /* ── Section Header (inside card) ── */
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  sectionIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textMain },
  sectionSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },

  /* ── Fields ── */
  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.textMuted,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8,
  },
  fieldGap: { height: 16 },
  noneActiveHint: { fontSize: 12, color: Colors.textMuted, fontStyle: 'italic', marginBottom: 6 },

  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  stepperMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepperLabel: { fontSize: 15, fontWeight: '600', color: Colors.textMain },

  inCardDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 20 },

  textInput: {
    backgroundColor: Colors.background, borderRadius: 10, padding: 14, fontSize: 14,
    color: Colors.textMain, borderWidth: 1, borderColor: Colors.border, minHeight: 48, textAlignVertical: 'top',
  },

  /* ── Bookmark Action ── */
  bookmarkAction: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: Colors.primary + '08', borderRadius: 10,
    marginBottom: 16,
  },
  bookmarkText: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.primary },

  /* ── Empty History ── */
  emptyHistory: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
  emptyHistoryIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  emptyHistoryTitle: { fontSize: 15, fontWeight: '600', color: Colors.textMuted, marginBottom: 4 },
  emptyHistoryBody: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },

  /* ── History List ── */
  historyList: {},
  historyCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingBottom: 14, marginBottom: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  historyCardLeft: { flex: 1 },
  historyDateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  historyDate: { fontSize: 15, fontWeight: '700', color: Colors.textMain },
  historyTimeBadge: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    backgroundColor: Colors.surfaceMuted,
  },
  historyTimeText: { fontSize: 10, fontWeight: '600', color: Colors.textMuted },
  historyMetaRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  historyChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    backgroundColor: Colors.background,
  },
  historyChipText: { fontSize: 11, fontWeight: '500', color: Colors.textMuted },
  historyMealTypes: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  reuseBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10,
    backgroundColor: Colors.primary + '10',
  },
  reuseBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  /* ── Sticky Action Bar ── */
  actionBar: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 20, paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12,
    backgroundColor: Colors.danger + '0A',
    borderWidth: 1, borderColor: Colors.danger + '25',
  },
  resetBtnText: { fontSize: 14, fontWeight: '600', color: Colors.danger },
  saveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  saveBtnDisabled: { backgroundColor: Colors.primary + '60' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
