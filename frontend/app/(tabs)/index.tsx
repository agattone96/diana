import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/utils/theme';
import ChipSelector from '../../src/components/ChipSelector';
import NumberStepper from '../../src/components/NumberStepper';
import { api } from '../../src/utils/api';

const TRIP_TYPES = ['Full week', 'Weekend', 'Quick trip', 'Special occasion'];
const STORES = ['Walmart', 'Tractor Supply', 'Amazon', "Sam's Club", 'Costco', 'Aldi', 'Target', 'Kroger'];
const MEAL_COVERAGE = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
const COOKING_STYLES = ['Easy meals', 'Crockpot', 'One pan', 'Sheet pan', 'Minimum effort', 'Batch cook', 'Air fryer', 'Instant pot'];
const DIETARY_RULES = ['Gluten free', 'Dairy free', 'Low carb', 'Vegetarian', 'Vegan', 'Keto', 'Nut free', 'Low sodium'];
const PRICE_MODES = ['No prices', 'Estimated prices', 'Cheap-first'];

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

  useEffect(() => {
    loadProfile();
  }, []);

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
    } catch (e) {
      console.error('Load profile failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggle = useCallback((list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.generatePlan({
        trip_type: tripType,
        budget: parseFloat(budget) || 200,
        adults,
        children,
        preferred_stores: stores,
        meal_coverage: meals,
        cooking_style: cookingStyle,
        dietary_rules: dietaryRules,
        exclusions,
        price_mode: priceMode,
      });
      router.push('/plan-results');
    } catch (e: any) {
      Alert.alert('Generation Failed', e.message || 'Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerEmoji}>&#127968;</Text>
            <Text style={styles.headerTitle}>This Week</Text>
            <Text style={styles.headerSubtitle}>Plan your meals & grocery run</Text>
          </View>

          {/* Trip Type */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TRIP TYPE</Text>
            <View style={styles.chipRow}>
              {TRIP_TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  testID={`trip-type-${t.toLowerCase().replace(/\s/g, '-')}`}
                  style={[styles.chip, tripType === t && styles.chipActive]}
                  onPress={() => setTripType(t)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, tripType === t && styles.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Budget */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>WEEKLY BUDGET</Text>
            <View style={styles.card}>
              <View style={styles.budgetRow}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  testID="budget-input"
                  style={styles.budgetInput}
                  value={budget}
                  onChangeText={setBudget}
                  keyboardType="numeric"
                  placeholder="200"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>
          </View>

          {/* Household */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>HOUSEHOLD</Text>
            <View style={styles.card}>
              <View style={styles.stepperRow}>
                <View>
                  <Text style={styles.stepperLabel}>Adults</Text>
                  <Text style={styles.stepperHint}>Ages 13+</Text>
                </View>
                <NumberStepper
                  value={adults}
                  onIncrement={() => setAdults(a => Math.min(a + 1, 20))}
                  onDecrement={() => setAdults(a => Math.max(a - 1, 1))}
                  min={1}
                  testID="adults-stepper"
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.stepperRow}>
                <View>
                  <Text style={styles.stepperLabel}>Children</Text>
                  <Text style={styles.stepperHint}>Ages 12 and under</Text>
                </View>
                <NumberStepper
                  value={children}
                  onIncrement={() => setChildren(c => Math.min(c + 1, 20))}
                  onDecrement={() => setChildren(c => Math.max(c - 1, 0))}
                  min={0}
                  testID="children-stepper"
                />
              </View>
            </View>
          </View>

          {/* Stores */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PREFERRED STORES</Text>
            <ChipSelector
              options={STORES}
              selected={stores}
              onToggle={(s) => toggle(stores, setStores, s)}
              testIDPrefix="store"
            />
          </View>

          {/* Meal Coverage */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>MEAL COVERAGE</Text>
            <ChipSelector
              options={MEAL_COVERAGE}
              selected={meals}
              onToggle={(m) => toggle(meals, setMeals, m)}
              testIDPrefix="meal"
            />
          </View>

          {/* Cooking Style */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>COOKING STYLE</Text>
            <ChipSelector
              options={COOKING_STYLES}
              selected={cookingStyle}
              onToggle={(c) => toggle(cookingStyle, setCookingStyle, c)}
              testIDPrefix="cooking"
            />
          </View>

          {/* Dietary Rules */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DIETARY RESTRICTIONS</Text>
            <ChipSelector
              options={DIETARY_RULES}
              selected={dietaryRules}
              onToggle={(d) => toggle(dietaryRules, setDietaryRules, d)}
              testIDPrefix="dietary"
            />
          </View>

          {/* Exclusions */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>EXCLUSIONS / DISLIKES / ALLERGIES</Text>
            <TextInput
              testID="exclusions-input"
              style={styles.textInput}
              value={exclusions}
              onChangeText={setExclusions}
              placeholder="e.g. mushrooms, cilantro, shellfish"
              placeholderTextColor={Colors.textMuted}
              multiline
            />
          </View>

          {/* Price Mode */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PRICE MODE</Text>
            <View style={styles.segmentedControl}>
              {PRICE_MODES.map(m => (
                <TouchableOpacity
                  key={m}
                  testID={`price-mode-${m.toLowerCase().replace(/\s/g, '-')}`}
                  style={[styles.segment, priceMode === m && styles.segmentActive]}
                  onPress={() => setPriceMode(m)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.segmentText, priceMode === m && styles.segmentTextActive]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* CTA */}
          <TouchableOpacity
            testID="build-plan-button"
            style={styles.ctaButton}
            onPress={handleGenerate}
            disabled={generating}
            activeOpacity={0.8}
          >
            {generating ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.ctaText}>Build This Week's Plan</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Generating overlay */}
      {generating && (
        <View style={styles.overlay}>
          <View style={styles.overlayBox}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.overlayTitle}>Building your plan...</Text>
            <Text style={styles.overlaySubtitle}>Matching meals to your pantry & preferences</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 12 },
  header: { marginBottom: 24 },
  headerEmoji: { fontSize: 32, marginBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: Colors.textMain, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 15, color: Colors.textMuted, marginTop: 4 },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1.2, marginBottom: 10, textTransform: 'uppercase' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: Colors.surfaceMuted },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { fontSize: 14, color: Colors.textMuted, fontWeight: '500' },
  chipTextActive: { color: '#FFF' },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.border },
  budgetRow: { flexDirection: 'row', alignItems: 'center' },
  dollarSign: { fontSize: 28, fontWeight: '700', color: Colors.primary, marginRight: 4 },
  budgetInput: { fontSize: 28, fontWeight: '700', color: Colors.textMain, flex: 1, padding: 0 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepperLabel: { fontSize: 16, fontWeight: '600', color: Colors.textMain },
  stepperHint: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 16 },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: Colors.textMain,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 56,
    textAlignVertical: 'top',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 12,
    padding: 4,
  },
  segment: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  segmentActive: { backgroundColor: Colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  segmentText: { fontSize: 13, fontWeight: '500', color: Colors.textMuted },
  segmentTextActive: { color: Colors.textMain, fontWeight: '600' },
  ctaButton: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayBox: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  overlayTitle: { fontSize: 18, fontWeight: '700', color: Colors.textMain, marginTop: 20 },
  overlaySubtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 8, textAlign: 'center' },
});
