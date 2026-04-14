import { Tabs, Redirect, router } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { HapticTab } from '@/components/haptic-tab';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';

const POST_BTN_SIZE = 41;

export default function TabLayout() {
  const { session, loading, user } = useAuth();
  const { colors } = useTheme();
  const unreadCount = useUnreadCount(user?.id);
  const [showPostPicker, setShowPostPicker] = useState(false);

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

  function handlePickTrade() {
    setShowPostPicker(false);
    router.push('/(tabs)/create');
  }

  function handlePickLFG() {
    setShowPostPicker(false);
    router.push({ pathname: '/(tabs)/lfg', params: { openCreate: '1' } });
  }

  return (
    <>
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
            tabBarButton: (props) => (
              <PlatformPressable
                {...props}
                onPress={() => {
                  if (process.env.EXPO_OS === 'ios') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setShowPostPicker(true);
                }}
              />
            ),
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

      {/* Post type picker */}
      <Modal
        visible={showPostPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPostPicker(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setShowPostPicker(false)}
        />
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={[styles.handle, { backgroundColor: colors.surfaceBorder }]} />
          <Text style={[styles.sheetTitle, { color: colors.text }]}>What do you want to post?</Text>

          <TouchableOpacity
            style={[styles.option, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}
            onPress={handlePickTrade}
            activeOpacity={0.75}
          >
            <View style={[styles.optionIcon, { backgroundColor: colors.accent + '20' }]}>
              <Ionicons name="swap-horizontal" size={24} color={colors.accent} />
            </View>
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>Trade Listing</Text>
              <Text style={[styles.optionSub, { color: colors.textMuted }]}>Post gear you want to sell or trade</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}
            onPress={handlePickLFG}
            activeOpacity={0.75}
          >
            <View style={[styles.optionIcon, { backgroundColor: colors.accent + '20' }]}>
              <Ionicons name="people" size={24} color={colors.accent} />
            </View>
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>LFG Post</Text>
              <Text style={[styles.optionSub, { color: colors.textMuted }]}>Find operators to squad up with</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: colors.surfaceBorder }]}
            onPress={() => setShowPostPicker(false)}
            activeOpacity={0.75}
          >
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderTopWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    gap: Spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sheetTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1 },
  optionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  optionSub: {
    fontSize: Typography.sizes.sm,
    marginTop: 2,
  },
  cancelBtn: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  cancelText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
});
