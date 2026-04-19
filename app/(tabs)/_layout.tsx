import { Tabs, Redirect, router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { HapticTab } from '@/components/haptic-tab';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const POST_BTN_SIZE = 41;

export default function TabLayout() {
  const { session, loading, user } = useAuth();
  const { colors } = useTheme();
  const unreadCount = useUnreadCount(user?.id);
  const [showPostPicker, setShowPostPicker] = useState(false);
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [disclosureChecked, setDisclosureChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  useEffect(() => {
    if (!session) return;
    AsyncStorage.multiGet(['@gzw_disclosure_v1', '@gzw_onboarding_v1']).then(([disc, onb]) => {
      if (!disc[1]) {
        setShowDisclosure(true);
      } else if (!onb[1]) {
        setShowOnboarding(true);
      }
    });
  }, [session]);

  async function handleAcceptDisclosure() {
    await AsyncStorage.setItem('@gzw_disclosure_v1', 'accepted');
    supabase.from('user_agreements').insert({
      user_id: user?.id,
      agreement_type: 'first_login_disclosure',
      version: '1',
    }).then(() => {});
    setDisclosureChecked(false);
    setShowDisclosure(false);
    const onbDone = await AsyncStorage.getItem('@gzw_onboarding_v1');
    if (!onbDone) {
      setOnboardingStep(0);
      setShowOnboarding(true);
    }
  }

  async function finishOnboarding() {
    await AsyncStorage.setItem('@gzw_onboarding_v1', 'done');
    if (user?.id) {
      supabase.from('profiles')
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq('id', user.id)
        .then(() => {});
    }
    setShowOnboarding(false);
    setOnboardingStep(0);
  }

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

      {/* First-login disclosure — cannot be dismissed */}
      <Modal
        visible={showDisclosure}
        transparent={false}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={[disclosureStyles.container, { backgroundColor: colors.background }]}>
          <ScrollView
            contentContainerStyle={disclosureStyles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[disclosureStyles.heading, { color: colors.text }]}>
              Before you start trading
            </Text>

            {[
              {
                icon: 'shield-checkmark-outline' as const,
                text: 'We do not sell or share your data. Your account information stays on our servers and is never sold to advertisers or third parties.',
              },
              {
                icon: 'ban-outline' as const,
                text: 'Real money trading (RMT) is prohibited. Trading in-game items for real money, gift cards, or anything of monetary value is strictly forbidden and will result in a permanent ban.',
              },
              {
                icon: 'information-circle-outline' as const,
                text: 'We are not affiliated with Mad Finger Games. GZW Market is a fan-made community tool. Gray Zone Warfare is a trademark of Mad Finger Games.',
              },
              {
                icon: 'ribbon-outline' as const,
                text: 'Reputation cannot be purchased. Verified Trader status and all reputation are earned through completed trade history only. They are never for sale.',
              },
            ].map(({ icon, text }) => (
              <View key={icon} style={[disclosureStyles.bullet, { borderColor: colors.surfaceBorder }]}>
                <Ionicons name={icon} size={20} color={colors.accent} style={disclosureStyles.bulletIcon} />
                <Text style={[disclosureStyles.bulletText, { color: colors.text }]}>{text}</Text>
              </View>
            ))}

            <TouchableOpacity
              style={disclosureStyles.checkRow}
              onPress={() => setDisclosureChecked((v) => !v)}
              activeOpacity={0.75}
            >
              <View style={[
                disclosureStyles.checkbox,
                { borderColor: colors.accent },
                disclosureChecked && { backgroundColor: colors.accent },
              ]}>
                {disclosureChecked && (
                  <Ionicons name="checkmark" size={14} color={colors.background} />
                )}
              </View>
              <Text style={[disclosureStyles.checkLabel, { color: colors.textSecondary }]}>
                I have read and understand the above.{' '}
                <Text style={[disclosureStyles.checkRequired, { color: colors.danger }]}>(required)</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                disclosureStyles.acceptBtn,
                { backgroundColor: disclosureChecked ? colors.accent : colors.surfaceBorder },
              ]}
              onPress={handleAcceptDisclosure}
              disabled={!disclosureChecked}
              activeOpacity={0.85}
            >
              <Text style={[
                disclosureStyles.acceptBtnText,
                { color: disclosureChecked ? colors.background : colors.textMuted },
              ]}>
                I Understand
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* 4-step onboarding walkthrough */}
      <Modal
        visible={showOnboarding}
        transparent={false}
        animationType="fade"
        onRequestClose={() => {}}
      >
        {(() => {
          const STEPS = [
            {
              icon: 'swap-horizontal' as const,
              title: 'How trading works',
              body: 'Post a listing with what you have and what you want in return. Other players message you. When you agree on a trade, confirm it in the chat — then rate each other.',
            },
            {
              icon: 'ribbon' as const,
              title: 'How reputation works',
              body: 'Your Verified Trader status comes from completed trade milestones only. It cannot be purchased, boosted, or transferred. Every trader starts at zero.',
            },
            {
              icon: 'shield-checkmark' as const,
              title: 'The rules',
              body: 'Real money trading (RMT) is a permanent ban — no appeal. Scamming and harassment result in strikes. Three strikes means account suspension. See Community Rules for the full list.',
            },
            {
              icon: 'flag' as const,
              title: 'If something goes wrong',
              body: 'Tap the ⚐ flag icon on any listing or profile to report. We review every report within 48 hours. Your reputation is yours — it is earned through trades, never through payment.',
            },
          ];
          const step = STEPS[onboardingStep];
          const isLast = onboardingStep === STEPS.length - 1;
          return (
            <View style={[onboardingStyles.container, { backgroundColor: colors.background }]}>
              {/* Skip */}
              <TouchableOpacity style={onboardingStyles.skip} onPress={finishOnboarding} hitSlop={12}>
                <Text style={[onboardingStyles.skipText, { color: colors.textMuted }]}>Skip</Text>
              </TouchableOpacity>

              {/* Step dots */}
              <View style={onboardingStyles.dots}>
                {STEPS.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      onboardingStyles.dot,
                      { backgroundColor: i === onboardingStep ? colors.accent : colors.surfaceBorder },
                    ]}
                  />
                ))}
              </View>

              {/* Content */}
              <View style={onboardingStyles.content}>
                <View style={[onboardingStyles.iconWrap, { backgroundColor: colors.accent + '18', borderColor: colors.accent + '40' }]}>
                  <Ionicons name={step.icon} size={40} color={colors.accent} />
                </View>
                <Text style={[onboardingStyles.title, { color: colors.text }]}>{step.title}</Text>
                <Text style={[onboardingStyles.body, { color: colors.textSecondary }]}>{step.body}</Text>
              </View>

              {/* Nav */}
              <View style={onboardingStyles.nav}>
                {onboardingStep > 0 && (
                  <TouchableOpacity
                    style={[onboardingStyles.backBtn, { borderColor: colors.surfaceBorder }]}
                    onPress={() => setOnboardingStep(s => s - 1)}
                    activeOpacity={0.75}
                  >
                    <Text style={[onboardingStyles.backBtnText, { color: colors.textSecondary }]}>Back</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[onboardingStyles.nextBtn, { backgroundColor: colors.accent }, onboardingStep === 0 && { flex: 1 }]}
                  onPress={() => isLast ? finishOnboarding() : setOnboardingStep(s => s + 1)}
                  activeOpacity={0.85}
                >
                  <Text style={[onboardingStyles.nextBtnText, { color: colors.background }]}>
                    {isLast ? "Let's Trade" : 'Next'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}
      </Modal>

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

const disclosureStyles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: 80,
    paddingBottom: 48,
    gap: Spacing.lg,
  },
  heading: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  bulletIcon: { marginTop: 1, flexShrink: 0 },
  bulletText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    lineHeight: 22,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  checkLabel: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    lineHeight: 22,
  },
  checkRequired: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  acceptBtn: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  acceptBtnText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.3,
  },
});

const onboardingStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: 48,
  },
  skip: {
    alignSelf: 'flex-end',
    paddingTop: 56,
    paddingBottom: Spacing.sm,
  },
  skipText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
  },
  body: {
    fontSize: Typography.sizes.md,
    lineHeight: 26,
    textAlign: 'center',
  },
  nav: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  backBtn: {
    flex: 0,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  nextBtn: {
    flex: 1,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  nextBtnText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
});

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
