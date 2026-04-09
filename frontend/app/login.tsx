import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppSession } from '../src/context/AppSessionContext';
import { useResponsive } from '../src/hooks/useResponsive';
import { Colors, Shadows } from '../src/utils/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { logIn } = useAppSession();
  const { contentMaxWidth, gutter } = useResponsive();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError('Enter your email and password.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const nextProfile = await logIn({ email: normalizedEmail, password });
      router.replace(nextProfile?.onboarding_completed ? '/(tabs)' : '/onboarding');
    } catch (e: any) {
      setError(e?.message || 'We could not log you in. Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={[s.wrap, { padding: gutter, maxWidth: contentMaxWidth }]}>
        <View style={s.card}>
          <Text style={s.title}>Log in</Text>
          <Text style={s.subtitle}>Pick up your weekly plan, defaults, and inventory where you left them.</Text>
          <TextInput style={s.input} placeholder="Email address" placeholderTextColor={Colors.textLight} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <TextInput style={s.input} placeholder="Password" placeholderTextColor={Colors.textLight} secureTextEntry value={password} onChangeText={setPassword} />
          {!!error && <Text style={s.errorText}>{error}</Text>}
          <TouchableOpacity style={s.primaryBtn} onPress={handleSubmit} disabled={loading}>
            <Text style={s.primaryBtnText}>{loading ? 'Logging in...' : 'Log In'}</Text>
          </TouchableOpacity>
          <Link href="/signup" asChild><TouchableOpacity><Text style={s.link}>Need an account? Sign Up</Text></TouchableOpacity></Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  wrap: { flex: 1, width: '100%', alignSelf: 'center', justifyContent: 'center' },
  card: { backgroundColor: Colors.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: Colors.border, ...Shadows.md },
  title: { fontSize: 30, fontWeight: '800', color: Colors.textMain },
  subtitle: { fontSize: 14, lineHeight: 21, color: Colors.textMuted, marginTop: 8, marginBottom: 18 },
  input: { backgroundColor: Colors.surfaceMuted, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 12, color: Colors.textMain },
  primaryBtn: { backgroundColor: Colors.accent, borderRadius: 14, alignItems: 'center', paddingVertical: 15, marginTop: 6 },
  primaryBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  errorText: { color: Colors.danger, fontSize: 13, marginTop: -2, marginBottom: 4 },
  link: { color: Colors.primary, fontSize: 13, fontWeight: '700', marginTop: 14 },
});
