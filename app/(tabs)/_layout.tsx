import { Tabs, Redirect } from 'expo-router';
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { HapticTab } from '@/components/haptic-tab';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useUnreadCount } from '@/hooks/useUnreadCount';

const POST_BTN_SIZE = 41;

export default function TabLayout() {
  const { session, loading, user } = useAuth();
  const { colors } = useTheme();
  const unreadCount = useUnreadCount(user?.id);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.surfaceBorder,
          borderTopWidth: 1,
          height: 95,
          paddingTop: 9,
          paddingBottom: 14,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {},
      }}
    >
      {/* ── Left 3 ── */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={25} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Browse',
          tabBarIcon: ({ color }) => (
            <Ionicons name="search" size={25} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lfg"
        options={{
          title: 'LFG',
          tabBarIcon: ({ color }) => (
            <Ionicons name="people" size={25} color={color} />
          ),
        }}
      />

      {/* ── Center ── */}
      <Tabs.Screen
        name="create"
        options={{
          title: 'Post',
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: POST_BTN_SIZE,
                height: POST_BTN_SIZE,
                borderRadius: POST_BTN_SIZE / 2,
                backgroundColor: focused ? colors.accent : colors.accentDim,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="add" size={25} color={colors.background} />
            </View>
          ),
          tabBarLabel: ({ focused }) => (
            <View>
              <Ionicons
                name="ellipse"
                size={5}
                color={focused ? colors.accent : 'transparent'}
              />
            </View>
          ),
        }}
      />

      {/* ── Right 3 ── */}
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'bookmark' : 'bookmark-outline'}
              size={25}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.danger,
            fontSize: 10,
            minWidth: 18,
            height: 18,
            lineHeight: 13,
          },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
              size={25}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={25}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
