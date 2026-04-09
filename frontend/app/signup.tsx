import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppSession } from '../src/context/AppSessionContext';
import { useResponsive } from '../src/hooks/useResponsive';
import { Colors, Shadows } from '../src/utils/theme';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAppSession();
  const { contentMaxWidth, gutter } = useResponsive();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    if (!trimmedName || !normalizedEmail || !password || !confirmPassword) {
      setError('Complete all fields to create your account.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Use at least 8 characters for your password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const nextProfile = await signUp({ name: trimmedName, email: normalizedEmail, password });
      setSuccess('Account created. Taking you to setup...');
      router.replace(nextProfile?.onboarding_completed ? '/(tabs)' : '/onboarding');
    } catch (e: any) {
      setError(e?.message || 'We could not create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={[s.wrap, { padding: gutter, maxWidth: contentMaxWidth }]}>
        <View style={s.card}>
          <Text style={s.title}>Create your account</Text>
          <Text style={s.subtitle}>Save household defaults, build weekly plans, and keep grocery flows editable across devices.</Text>
          <TextInput style={s.input} placeholder="Household name" placeholderTextColor={Colors.textLight} value={name} onChangeText={setName} />
          <TextInput style={s.input} placeholder="Email address" placeholderTextColor={Colors.textLight} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <TextInput style={s.input} placeholder="Password (min 8 characters)" placeholderTextColor={Colors.textLight} secureTextEntry value={password} onChangeText={setPassword} />
          <TextInput style={s.input} placeholder="Confirm password" placeholderTextColor={Colors.textLight} secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
          {!!error && <Text style={s.errorText}>{error}</Text>}
          {!!success && <Text style={s.successText}>{success}</Text>}
          <TouchableOpacity style={s.primaryBtn} onPress={handleSubmit} disabled={loading}>
            <Text style={s.primaryBtnText}>{loading ? 'Creating account...' : 'Create Account'}</Text>
          </TouchableOpacity>
          <Link href="/login" asChild><TouchableOpacity><Text style={s.link}>Already have an account? Log In</Text></TouchableOpacity></Link>
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
  errorText: { color: Colors.danger, fontSize: 13, marginTop: -2, marginBottom: 4 },
  successText: { color: Colors.success, fontSize: 13, marginTop: -2, marginBottom: 4 },
  primaryBtn: { backgroundColor: Colors.accent, borderRadius: 14, alignItems: 'center', paddingVertical: 15, marginTop: 6 },
  primaryBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  link: { color: Colors.primary, fontSize: 13, fontWeight: '700', marginTop: 14 },
});
