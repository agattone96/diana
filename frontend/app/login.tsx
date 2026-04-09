import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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

  const handleSubmit = async () => {
    if (!email || !password) return Alert.alert('Missing fields', 'Enter your email and password.');
    setLoading(true);
    try {
      await logIn({ email, password });
      router.replace('/onboarding');
    } catch (e: any) {
      Alert.alert('Login failed', e.message);
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
          <TextInput style={s.input} placeholder="Email" placeholderTextColor={Colors.textLight} autoCapitalize="none" value={email} onChangeText={setEmail} />
          <TextInput style={s.input} placeholder="Password" placeholderTextColor={Colors.textLight} secureTextEntry value={password} onChangeText={setPassword} />
          <TouchableOpacity style={s.primaryBtn} onPress={handleSubmit} disabled={loading}>
            <Text style={s.primaryBtnText}>{loading ? 'Logging in...' : 'Log In'}</Text>
          </TouchableOpacity>
          <TouchableOpacity><Text style={s.linkMuted}>Forgot password</Text></TouchableOpacity>
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
  linkMuted: { color: Colors.textMuted, fontSize: 13, marginTop: 12 },
  link: { color: Colors.primary, fontSize: 13, fontWeight: '700', marginTop: 14 },
});
