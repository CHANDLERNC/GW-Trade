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
