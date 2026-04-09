import { Redirect, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ChipSelector from '../src/components/ChipSelector';
import NumberStepper from '../src/components/NumberStepper';
import { DEFAULT_COOKING_STYLES, DEFAULT_DIETARY_RULES, DEFAULT_MEAL_COVERAGE, DEFAULT_STORES } from '../src/data/options';
import { useAppSession } from '../src/context/AppSessionContext';
import { useResponsive } from '../src/hooks/useResponsive';
import { api } from '../src/utils/api';
import { Colors, Shadows } from '../src/utils/theme';

export default function OnboardingScreen() {
  const router = useRouter();
  const { token, profile, refreshProfile, setProfile } = useAppSession();
  const { contentMaxWidth, gutter } = useResponsive();
  const [adults, setAdults] = useState(profile?.adults ?? 2);
  const [children, setChildren] = useState(profile?.children ?? 0);
  const [preferredStores, setPreferredStores] = useState<string[]>(profile?.preferred_stores ?? ['Walmart']);
  const [mealCoverage, setMealCoverage] = useState<string[]>(profile?.meal_coverage ?? ['Dinner']);
  const [cookingStyle, setCookingStyle] = useState<string[]>(profile?.cooking_style ?? ['Easy meals']);
  const [dietaryRules, setDietaryRules] = useState<string[]>(profile?.dietary_rules ?? []);
  const [exclusions, setExclusions] = useState(profile?.exclusions ?? '');
  const [budget, setBudget] = useState(String(profile?.budget ?? 200));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const subtitle = useMemo(() => 'A quick setup so This Week starts prefilled instead of blank.', []);

  if (!token) return <Redirect href="/" />;
  if (profile?.onboarding_completed) return <Redirect href="/(tabs)" />;

  const toggle = (list: string[], setter: (next: string[]) => void, item: string) =>
    setter(list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item]);

  const handleFinish = async () => {
    setError('');
    if (preferredStores.length === 0) {
      setError('Choose at least one preferred store.');
      return;
    }
    if (mealCoverage.length === 0) {
      setError('Choose at least one meal coverage option.');
      return;
    }
    const parsedBudget = Number(budget);
    if (Number.isNaN(parsedBudget) || parsedBudget < 0) {
      setError('Enter a valid budget amount.');
      return;
    }

    setSaving(true);
    try {
      const updated = await api.updateProfile({
        adults,
        children,
        preferred_stores: preferredStores,
        meal_coverage: mealCoverage,
        cooking_style: cookingStyle,
        dietary_rules: dietaryRules,
        exclusions,
        budget: parsedBudget,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      });
      setProfile(updated);
      await refreshProfile();
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e?.message || 'We could not save your setup. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={{ padding: gutter }}>
        <View style={[s.wrap, { maxWidth: contentMaxWidth }]}>
          <View style={s.headerCard}>
            <Text style={s.title}>Set your starting defaults</Text>
            <Text style={s.subtitle}>{subtitle}</Text>
          </View>

          <View style={s.card}>
            <Text style={s.sectionTitle}>Household</Text>
            <NumberStepper value={adults} onIncrement={() => setAdults((v) => v + 1)} onDecrement={() => setAdults((v) => Math.max(1, v - 1))} testID="onboarding-adults" label="Adults" />
            <View style={s.stepperGap} />
            <NumberStepper value={children} onIncrement={() => setChildren((v) => v + 1)} onDecrement={() => setChildren((v) => Math.max(0, v - 1))} testID="onboarding-children" label="Children" />
          </View>

          <View style={s.card}>
            <Text style={s.sectionTitle}>Shopping and meals</Text>
            <Text style={s.label}>Preferred stores</Text>
            <ChipSelector options={DEFAULT_STORES} selected={preferredStores} onToggle={(item) => toggle(preferredStores, setPreferredStores, item)} testIDPrefix="onboard-store" />
            <Text style={s.label}>Meal coverage</Text>
            <ChipSelector options={DEFAULT_MEAL_COVERAGE} selected={mealCoverage} onToggle={(item) => toggle(mealCoverage, setMealCoverage, item)} testIDPrefix="onboard-meal" />
            <Text style={s.label}>Cooking style</Text>
            <ChipSelector options={DEFAULT_COOKING_STYLES} selected={cookingStyle} onToggle={(item) => toggle(cookingStyle, setCookingStyle, item)} testIDPrefix="onboard-style" />
          </View>

          <View style={s.card}>
            <Text style={s.sectionTitle}>Food rules</Text>
            <Text style={s.label}>Dietary defaults</Text>
            <ChipSelector options={DEFAULT_DIETARY_RULES} selected={dietaryRules} onToggle={(item) => toggle(dietaryRules, setDietaryRules, item)} testIDPrefix="onboard-diet" />
            <Text style={s.label}>Exclusions</Text>
            <TextInput style={s.input} value={exclusions} onChangeText={setExclusions} placeholder="Example: mushrooms, olives, spicy breakfasts" placeholderTextColor={Colors.textLight} />
            <Text style={s.label}>Starting budget</Text>
            <TextInput style={s.input} value={budget} onChangeText={setBudget} placeholder="200" keyboardType="decimal-pad" placeholderTextColor={Colors.textLight} />
          </View>
          {!!error && <Text style={s.errorText}>{error}</Text>}

          <TouchableOpacity style={s.primaryBtn} onPress={handleFinish} disabled={saving}>
            <Text style={s.primaryBtnText}>{saving ? 'Saving defaults...' : 'Finish Setup'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  wrap: { width: '100%', alignSelf: 'center', gap: 14, paddingVertical: 20 },
  headerCard: { backgroundColor: Colors.surfaceTint, borderRadius: 24, padding: 22, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  title: { fontSize: 30, fontWeight: '800', color: Colors.textMain },
  subtitle: { fontSize: 14, lineHeight: 21, color: Colors.textMuted, marginTop: 8 },
  card: { backgroundColor: Colors.surface, borderRadius: 22, padding: 20, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.textMain, marginBottom: 14 },
  stepperGap: { height: 12 },
  label: { fontSize: 12, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 14, marginBottom: 10 },
  input: { backgroundColor: Colors.surfaceMuted, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.textMain },
  errorText: { color: Colors.danger, fontSize: 13, marginHorizontal: 2 },
  primaryBtn: { backgroundColor: Colors.accent, borderRadius: 16, alignItems: 'center', paddingVertical: 16, marginTop: 6 },
  primaryBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
});
