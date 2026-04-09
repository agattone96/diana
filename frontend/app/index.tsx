import { Redirect, useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppSession } from '../src/context/AppSessionContext';
import { useResponsive } from '../src/hooks/useResponsive';
import { Colors, Shadows } from '../src/utils/theme';

export default function LandingScreen() {
  const router = useRouter();
  const { token, profile } = useAppSession();
  const { contentMaxWidth, isDesktop, gutter } = useResponsive();

  if (token && profile?.onboarding_completed) return <Redirect href="/(tabs)" />;
  if (token) return <Redirect href="/onboarding" />;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={[s.scroll, { padding: gutter }]}>
        <View style={[s.wrap, { maxWidth: contentMaxWidth }]}>
          <View style={[s.hero, isDesktop && s.heroDesktop]}>
            <View style={s.heroMain}>
              <Text style={s.eyebrow}>Pantry-aware weekly planning</Text>
              <Text style={s.title}>Plan realistic meals from what you already have.</Text>
              <Text style={s.body}>
                Diana&apos;s Pantry Plan turns household defaults, pantry context, grocery must-haves, and low-effort meal preferences
                into an editable weekly plan built for real life.
              </Text>
              <View style={s.ctaRow}>
                <TouchableOpacity style={s.primaryBtn} onPress={() => router.push('/signup')}>
                  <Text style={s.primaryBtnText}>Sign Up</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.secondaryBtn} onPress={() => router.push('/login')}>
                  <Text style={s.secondaryBtnText}>Log In</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={s.previewCard}>
              <Text style={s.previewTitle}>This Week</Text>
              <Text style={s.previewSubtitle}>Structured, editable, pantry-first planning</Text>
              <View style={s.previewBlock}>
                <Text style={s.previewLabel}>Quick Setup</Text>
                <Text style={s.previewValue}>Budget-aware, household sized, effort-weighted</Text>
              </View>
              <View style={s.previewBlock}>
                <Text style={s.previewLabel}>AI Controls</Text>
                <Text style={s.previewValue}>Prompt input, custom notes, inventory and required-item overrides</Text>
              </View>
              <View style={s.previewBlock}>
                <Text style={s.previewLabel}>Reusable Defaults</Text>
                <Text style={s.previewValue}>Stores, cooking styles, tags, exclusions, and saved planning instructions</Text>
              </View>
            </View>
          </View>

          <View style={[s.benefits, isDesktop && s.benefitsDesktop]}>
            {[
              'Pantry-aware planning that starts with what is already on hand',
              'Editable grocery and required-item lists that stay useful week to week',
              'Low-effort meal plans with realistic overlap and less waste',
              'Defaults that grow with the household instead of locking to presets',
            ].map((item) => (
              <View key={item} style={s.benefitCard}>
                <Text style={s.benefitText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundWarm },
  scroll: { flexGrow: 1 },
  wrap: { width: '100%', alignSelf: 'center', gap: 20, paddingVertical: 24 },
  hero: { gap: 18 },
  heroDesktop: { flexDirection: 'row', alignItems: 'stretch' },
  heroMain: { flex: 1, backgroundColor: Colors.surfaceTint, borderRadius: 28, padding: 28, borderWidth: 1, borderColor: Colors.border, ...Shadows.md },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: Colors.primary },
  title: { fontSize: 42, lineHeight: 46, fontWeight: '800', color: Colors.textMain, marginTop: 12, maxWidth: 620 },
  body: { fontSize: 16, lineHeight: 25, color: Colors.textSecondary, marginTop: 14, maxWidth: 560 },
  ctaRow: { flexDirection: 'row', gap: 12, marginTop: 24, flexWrap: 'wrap' },
  primaryBtn: { backgroundColor: Colors.accent, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 15, ...Shadows.accent },
  primaryBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  secondaryBtn: { backgroundColor: Colors.surface, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 15, borderWidth: 1, borderColor: Colors.border },
  secondaryBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 15 },
  previewCard: { flex: 1, minWidth: 300, backgroundColor: Colors.surface, borderRadius: 28, padding: 24, borderWidth: 1, borderColor: Colors.border, ...Shadows.lg },
  previewTitle: { fontSize: 24, fontWeight: '800', color: Colors.textMain },
  previewSubtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 4, marginBottom: 16 },
  previewBlock: { paddingVertical: 14, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  previewLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7, color: Colors.textMuted, marginBottom: 6 },
  previewValue: { fontSize: 15, lineHeight: 22, color: Colors.textSecondary },
  benefits: { gap: 12 },
  benefitsDesktop: { flexDirection: 'row', flexWrap: 'wrap' },
  benefitCard: { flex: 1, minWidth: 220, backgroundColor: Colors.surface, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  benefitText: { fontSize: 14, lineHeight: 21, color: Colors.textSecondary, fontWeight: '600' },
});
