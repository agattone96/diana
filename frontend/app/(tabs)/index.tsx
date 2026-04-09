import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../src/utils/theme';
import ChipSelector from '../../src/components/ChipSelector';
import NumberStepper from '../../src/components/NumberStepper';
import { api } from '../../src/utils/api';

const TRIP_TYPES = ['Full week', 'Weekend', 'Quick trip', 'Special occasion'];
const STORES = ['Walmart', 'Tractor Supply', 'Amazon', "Sam's Club", 'Costco', 'Aldi', 'Target', 'Kroger'];
const MEAL_COVERAGE = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
const COOKING_STYLES = ['Easy meals', 'Crockpot', 'One pan', 'Sheet pan', 'Minimum effort', 'Batch cook', 'Air fryer', 'Instant pot'];
const DIETARY_RULES = ['Gluten free', 'Dairy free', 'Low carb', 'Vegetarian', 'Vegan', 'Keto', 'Nut free', 'Low sodium'];
const PRICE_MODES = ['No prices', 'Estimated', 'Cheap-first'];

function Label({ children }: { children: string }) {
  return <Text style={s.fieldLabel}>{children}</Text>;
}

export default function ThisWeek() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [tripType, setTripType] = useState('Full week');
  const [budget, setBudget] = useState('200');
  const [adults, setAdults] = useState(4);
  const [children, setChildren] = useState(1);
  const [stores, setStores] = useState<string[]>([]);
  const [meals, setMeals] = useState<string[]>([]);
  const [cookingStyle, setCookingStyle] = useState<string[]>([]);
  const [dietaryRules, setDietaryRules] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState('');
  const [priceMode, setPriceMode] = useState('No prices');

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const p = await api.getProfile();
      if (p) {
        setTripType(p.trip_type || 'Full week');
        setBudget(String(p.budget ?? 200));
        setAdults(p.adults ?? 4);
        setChildren(p.children ?? 1);
        setStores(p.preferred_stores || []);
        setMeals(p.meal_coverage || []);
        setCookingStyle(p.cooking_style || []);
        setDietaryRules(p.dietary_rules || []);
        setExclusions(p.exclusions || '');
        setPriceMode(p.price_mode || 'No prices');
      }
    } catch (e) { console.error('Load profile:', e); }
    finally { setLoading(false); }
  };

  const toggle = useCallback((list: string[], set: (v: string[]) => void, item: string) => {
    set(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.generatePlan({ trip_type: tripType, budget: parseFloat(budget) || 200, adults, children, preferred_stores: stores, meal_coverage: meals, cooking_style: cookingStyle, dietary_rules: dietaryRules, exclusions, price_mode: priceMode });
      router.push('/plan-results');
    } catch (e: any) { Alert.alert('Generation Failed', e.message || 'Please try again.'); }
    finally { setGenerating(false); }
  };

  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View></SafeAreaView>;

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollInner} showsVerticalScrollIndicator={false}>

          {/* ── Header ── */}
          <View style={s.header}>
            <Text style={s.title}>This Week</Text>
            <Text style={s.subtitle}>Plan your meals & grocery run</Text>
            <View style={s.summaryRow}>
              <View style={s.pill}><Ionicons name="people-outline" size={12} color={Colors.textMuted} /><Text style={s.pillText}>{adults}A, {children}C</Text></View>
              <View style={s.pill}><Ionicons name="wallet-outline" size={12} color={Colors.textMuted} /><Text style={s.pillText}>${budget}</Text></View>
              <View style={s.pill}><Text style={s.pillText}>{tripType}</Text></View>
            </View>
          </View>

          {/* ── Card 1 — Quick Setup ── */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.cardIconWrap}><Ionicons name="flash-outline" size={15} color={Colors.accent} /></View>
              <Text style={s.cardTitle}>Quick Setup</Text>
            </View>

            <Label>Trip type</Label>
            <View style={s.chipRow}>
              {TRIP_TYPES.map(t => (
                <TouchableOpacity key={t} testID={`trip-type-${t.toLowerCase().replace(/\s/g,'-')}`} style={[s.tripChip, tripType === t && s.tripChipOn]} onPress={() => setTripType(t)} activeOpacity={0.7}>
                  <Text style={[s.tripChipText, tripType === t && s.tripChipTextOn]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.cardDivider} />

            <Label>Weekly budget</Label>
            <View style={s.budgetWrap}>
              <Text style={s.budgetSign}>$</Text>
              <TextInput testID="budget-input" style={s.budgetInput} value={budget} onChangeText={setBudget} keyboardType="numeric" placeholder="200" placeholderTextColor={Colors.textLight} />
            </View>

            <View style={s.cardDivider} />

            <Label>Household</Label>
            <View style={s.stepperBlock}>
              <NumberStepper label="Adults" hint="Ages 13+" value={adults} onIncrement={() => setAdults(a => Math.min(a+1,20))} onDecrement={() => setAdults(a => Math.max(a-1,1))} min={1} testID="adults-stepper" />
            </View>
            <View style={s.stepperBlock}>
              <NumberStepper label="Children" hint="Under 13" value={children} onIncrement={() => setChildren(c => Math.min(c+1,20))} onDecrement={() => setChildren(c => Math.max(c-1,0))} min={0} testID="children-stepper" />
            </View>
          </View>

          {/* ── Card 2 — Preferences ── */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.cardIconWrap}><Ionicons name="options-outline" size={15} color={Colors.primary} /></View>
              <Text style={s.cardTitle}>Preferences</Text>
            </View>

            <Label>Preferred stores</Label>
            <ChipSelector options={STORES} selected={stores} onToggle={(st) => toggle(stores, setStores, st)} testIDPrefix="store" />

            <View style={s.cardDivider} />
            <Label>Meal coverage</Label>
            <ChipSelector options={MEAL_COVERAGE} selected={meals} onToggle={(m) => toggle(meals, setMeals, m)} testIDPrefix="meal" />

            <View style={s.cardDivider} />
            <Label>Cooking style</Label>
            <ChipSelector options={COOKING_STYLES} selected={cookingStyle} onToggle={(c) => toggle(cookingStyle, setCookingStyle, c)} testIDPrefix="cooking" />
          </View>

          {/* ── Card 3 — Advanced ── */}
          <View style={[s.card, s.cardMuted]}>
            <View style={s.cardHeader}>
              <View style={[s.cardIconWrap, { backgroundColor: Colors.surfaceMuted }]}><Ionicons name="filter-outline" size={15} color={Colors.textMuted} /></View>
              <Text style={s.cardTitle}>Advanced</Text>
            </View>

            <Label>Dietary restrictions</Label>
            {dietaryRules.length === 0 && <Text style={s.hintText}>None — tap to add</Text>}
            <ChipSelector options={DIETARY_RULES} selected={dietaryRules} onToggle={(d) => toggle(dietaryRules, setDietaryRules, d)} testIDPrefix="dietary" />

            <View style={s.cardDivider} />
            <Label>Exclusions & dislikes</Label>
            <TextInput testID="exclusions-input" style={s.textInput} value={exclusions} onChangeText={setExclusions} placeholder="e.g. mushrooms, cilantro, shellfish" placeholderTextColor={Colors.textLight} multiline />

            <View style={s.cardDivider} />
            <Label>Price mode</Label>
            <View style={s.segmented}>
              {PRICE_MODES.map(m => (
                <TouchableOpacity key={m} testID={`price-mode-${m.toLowerCase().replace(/\s/g,'-')}`} style={[s.seg, priceMode === m && s.segOn]} onPress={() => setPriceMode(m)} activeOpacity={0.7}>
                  <Text style={[s.segText, priceMode === m && s.segTextOn]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Sticky CTA ── */}
      <View style={s.ctaBar}>
        <TouchableOpacity testID="build-plan-button" style={s.ctaBtn} onPress={handleGenerate} disabled={generating} activeOpacity={0.8}>
          {generating ? <ActivityIndicator color="#FFF" /> : (
            <><Ionicons name="sparkles" size={18} color="#FFF" style={{ marginRight: 8 }} /><Text style={s.ctaText}>Build This Week's Plan</Text></>
          )}
        </TouchableOpacity>
      </View>

      {generating && (
        <View style={s.overlay}>
          <View style={s.overlayBox}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={s.overlayTitle}>Building your plan...</Text>
            <Text style={s.overlayHint}>Matching meals to your pantry & preferences</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollInner: { padding: 20, paddingTop: 12 },

  header: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textMain, letterSpacing: -0.4 },
  subtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 2 },
  summaryRow: { flexDirection: 'row', gap: 6, marginTop: 12 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surfaceMuted, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  pillText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },

  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  cardMuted: { backgroundColor: Colors.surfaceRaised, borderColor: Colors.borderLight },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  cardIconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.accentMuted, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.textMain },
  cardDivider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 16 },

  fieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 },
  hintText: { fontSize: 12, color: Colors.textLight, fontStyle: 'italic', marginBottom: 6 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tripChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: Colors.surfaceMuted, borderWidth: 1, borderColor: 'transparent' },
  tripChipOn: { backgroundColor: Colors.accent + '14', borderColor: Colors.accent + '30' },
  tripChipText: { fontSize: 13, fontWeight: '500', color: Colors.textMuted },
  tripChipTextOn: { color: Colors.accent, fontWeight: '600' },

  budgetWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceMuted, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 4 },
  budgetSign: { fontSize: 22, fontWeight: '700', color: Colors.primary, marginRight: 4 },
  budgetInput: { fontSize: 22, fontWeight: '700', color: Colors.textMain, flex: 1, padding: 8 },

  stepperBlock: { marginBottom: 10 },

  textInput: { backgroundColor: Colors.surfaceMuted, borderRadius: 10, padding: 14, fontSize: 14, color: Colors.textMain, minHeight: 44, textAlignVertical: 'top' },

  segmented: { flexDirection: 'row', backgroundColor: Colors.surfaceMuted, borderRadius: 10, padding: 3 },
  seg: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  segOn: { backgroundColor: Colors.surface, ...Shadows.sm },
  segText: { fontSize: 12.5, fontWeight: '500', color: Colors.textMuted },
  segTextOn: { color: Colors.textMain, fontWeight: '600' },

  ctaBar: { paddingHorizontal: 20, paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 28 : 10, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  ctaBtn: { backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', ...Shadows.accent },
  ctaText: { fontSize: 16, fontWeight: '700', color: '#FFF' },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  overlayBox: { backgroundColor: Colors.surface, borderRadius: 20, padding: 32, alignItems: 'center', marginHorizontal: 40, ...Shadows.lg },
  overlayTitle: { fontSize: 17, fontWeight: '700', color: Colors.textMain, marginTop: 20 },
  overlayHint: { fontSize: 13, color: Colors.textMuted, marginTop: 6, textAlign: 'center' },
});
