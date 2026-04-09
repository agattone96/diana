import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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

  const handleSubmit = async () => {
    if (!name || !email || !password || !confirmPassword) return Alert.alert('Missing fields', 'Complete all fields to create an account.');
    if (password !== confirmPassword) return Alert.alert('Password mismatch', 'Passwords must match.');
    setLoading(true);
    try {
      await signUp({ name, email, password });
      router.replace('/onboarding');
    } catch (e: any) {
      Alert.alert('Sign up failed', e.message);
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
          <TextInput style={s.input} placeholder="Name" placeholderTextColor={Colors.textLight} value={name} onChangeText={setName} />
          <TextInput style={s.input} placeholder="Email" placeholderTextColor={Colors.textLight} autoCapitalize="none" value={email} onChangeText={setEmail} />
          <TextInput style={s.input} placeholder="Password" placeholderTextColor={Colors.textLight} secureTextEntry value={password} onChangeText={setPassword} />
          <TextInput style={s.input} placeholder="Confirm password" placeholderTextColor={Colors.textLight} secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
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
  primaryBtn: { backgroundColor: Colors.accent, borderRadius: 14, alignItems: 'center', paddingVertical: 15, marginTop: 6 },
  primaryBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  link: { color: Colors.primary, fontSize: 13, fontWeight: '700', marginTop: 14 },
});
