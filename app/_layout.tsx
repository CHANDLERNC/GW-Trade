import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutInner() {
  const { colors, isDark } = useTheme();

  return (
    <AuthProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor="transparent" translucent />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="listing/[id]"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerTitle: 'Listing',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="listing/edit/[id]"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerTitle: 'Edit Listing',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="conversation/[id]"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerTitle: 'Messages',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="user/[id]"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerTitle: '',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="price-history/[item]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="price-history/category/[cat]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="legal/terms"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerTitle: 'Terms of Service',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="legal/privacy"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerTitle: 'Privacy Policy',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="legal/community-rules"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerTitle: 'Community Rules',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="transparency/costs"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerTitle: 'Keep The Lights On',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="transparency/roadmap"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerTitle: 'Roadmap',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="transparency/changelog"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerTitle: 'Changelog',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="about/index"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerTitle: 'About',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="about/team"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerTitle: 'The Team',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="settings/delete-data"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerTitle: 'Delete My Data',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="settings/account-standing"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerTitle: 'Account Standing',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="about/faq"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerTitle: 'FAQ',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="about/moderators"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerTitle: 'Moderation Team',
            headerBackTitle: 'Back',
          }}
        />
      </Stack>
    </AuthProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutInner />
    </ThemeProvider>
  );
}
