import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GZW, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { authService } from '@/services/auth.service';

function validate(username: string, email: string, password: string): string | null {
  if (!username.trim()) return 'Username is required.';
  if (username.trim().length < 3) return 'Username must be at least 3 characters.';
  if (!/^[a-zA-Z0-9_]+$/.test(username.trim()))
    return 'Username can only contain letters, numbers, and underscores.';
  if (!email.trim()) return 'Email is required.';
  if (!email.includes('@')) return 'Enter a valid email.';
  if (!password) return 'Password is required.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return null;
}

export default function SignUpScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignUp = async () => {
    const validationError = validate(username, email, password);
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await authService.signUp(
      email.trim().toLowerCase(),
      password,
      username.trim()
    );
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>Account created!</Text>
          <Text style={styles.successSubtitle}>
            Check your email to confirm your account, then sign in.
          </Text>
          <Button
            title="Go to Sign In"
            onPress={() => router.replace('/(auth)/sign-in')}
            fullWidth
            size="lg"
            style={{ marginTop: Spacing.lg }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Join GZW Market</Text>
            <Text style={styles.subtitle}>Create your trader account</Text>
          </View>

          <View style={styles.form}>
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Input
              label="Username"
              value={username}
              onChangeText={setUsername}
              placeholder="your_callsign"
              autoCapitalize="none"
              autoCorrect={false}
              hint="Letters, numbers and underscores only"
            />

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              secureTextEntry
              textContentType="newPassword"
            />

            <Button
              title="Create Account"
              onPress={handleSignUp}
              loading={loading}
              fullWidth
              size="lg"
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/sign-in')}>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GZW.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.xl,
  },
  back: { paddingTop: Spacing.md },
  backText: { fontSize: Typography.sizes.md, color: GZW.textSecondary },
  header: { gap: Spacing.xs },
  title: {
    fontSize: Typography.sizes.xxxl,
    fontWeight: Typography.weights.bold,
    color: GZW.text,
  },
  subtitle: { fontSize: Typography.sizes.md, color: GZW.textSecondary },
  form: { gap: Spacing.md },
  errorBox: {
    backgroundColor: GZW.danger + '22',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: GZW.danger + '55',
    padding: Spacing.md,
  },
  errorText: { fontSize: Typography.sizes.sm, color: GZW.danger },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: Spacing.lg,
  },
  footerText: { fontSize: Typography.sizes.md, color: GZW.textSecondary },
  footerLink: {
    fontSize: Typography.sizes.md,
    color: GZW.accent,
    fontWeight: Typography.weights.semibold,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  successIcon: {
    fontSize: 56,
    color: GZW.success,
  },
  successTitle: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: GZW.text,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: Typography.sizes.md,
    color: GZW.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
