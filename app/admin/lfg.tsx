import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/services/admin.service';
import { LFGPost } from '@/types';
import { timeAgo } from '@/utils/dateFormat';

const FILTER_OPTIONS = [
  { label: 'All', value: false },
  { label: 'Active', value: true },
] as const;

export default function AdminLFGScreen() {
  const { colors } = useTheme();
  const { profile: me } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [posts, setPosts] = useState<LFGPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeOnly, setActiveOnly] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await adminService.fetchAllLFGPosts(activeOnly);
    setPosts(data);
    setLoading(false);
    setRefreshing(false);
  }, [activeOnly]);

  React.useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const handleDeactivate = async (post: LFGPost) => {
    setActing(post.id);
    const { error } = await adminService.deactivateLFGPost(post.id);
    setActing(null);
    if (error) {
      Alert.alert('Error', 'Could not deactivate post.');
    } else {
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_active: false } : p));
    }
  };

  const handleDelete = (post: LFGPost) => {
    const owner = (post.profiles as any)?.display_name ?? (post.profiles as any)?.username ?? 'Unknown';
    Alert.alert(
      'Delete LFG Post',
      `Delete ${owner}'s LFG post? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActing(post.id);
            const { error } = await adminService.deleteLFGPost(post.id);
            setActing(null);
            if (error) {
              Alert.alert('Error', 'Could not delete post.');
            } else {
              setPosts(prev => prev.filter(p => p.id !== post.id));
            }
          },
        },
      ]
    );
  };

  if (!me?.is_admin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="lock-closed-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyText}>Access denied</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>LFG Posts</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{posts.length}</Text>
          </View>
        </View>
        <View style={{ width: 22 }} />
      </View>

      {/* Active filter */}
      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map(f => (
          <TouchableOpacity
            key={String(f.value)}
            style={[styles.filterChip, activeOnly === f.value && styles.filterChipActive]}
            onPress={() => setActiveOnly(f.value)}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterChipText, activeOnly === f.value && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={p => p.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="people-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>No LFG posts found</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isActing = acting === item.id;
            const owner = (item.profiles as any)?.display_name ?? (item.profiles as any)?.username ?? 'Unknown';
            const isExpired = new Date(item.expires_at) < new Date();

            return (
              <View style={[styles.card, (!item.is_active || isExpired) && styles.cardInactive]}>
                {/* Top row */}
                <View style={styles.cardTop}>
                  <Text style={styles.ownerName}>{owner}</Text>
                  <View style={styles.pillsRow}>
                    {!item.is_active && (
                      <View style={styles.inactivePill}>
                        <Text style={styles.inactivePillText}>Inactive</Text>
                      </View>
                    )}
                    {isExpired && item.is_active && (
                      <View style={styles.expiredPill}>
                        <Text style={styles.expiredPillText}>Expired</Text>
                      </View>
                    )}
                    {item.is_active && !isExpired && (
                      <View style={styles.activePill}>
                        <Text style={styles.activePillText}>Active</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Meta */}
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>{item.faction}</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.metaText}>{item.zone}</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.metaText}>{item.region}</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.metaText}>{item.slots_total} slots</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.metaText}>{timeAgo(item.created_at)}</Text>
                </View>

                {item.description ? (
                  <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                ) : null}

                {/* Actions */}
                <View style={styles.actions}>
                  {item.is_active && !isExpired && (
                    <TouchableOpacity
                      style={[styles.deactivateBtn, isActing && styles.btnDisabled]}
                      onPress={() => handleDeactivate(item)}
                      disabled={isActing}
                      activeOpacity={0.8}
                    >
                      {isActing ? (
                        <ActivityIndicator size="small" color={colors.textSecondary} />
                      ) : (
                        <>
                          <Ionicons name="pause-circle-outline" size={14} color={colors.textSecondary} />
                          <Text style={styles.deactivateBtnText}>Deactivate</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.deleteBtn, isActing && styles.btnDisabled]}
                    onPress={() => handleDelete(item)}
                    disabled={isActing}
                    activeOpacity={0.8}
                  >
                    {isActing ? (
                      <ActivityIndicator size="small" color={colors.danger} />
                    ) : (
                      <>
                        <Ionicons name="trash-outline" size={14} color={colors.danger} />
                        <Text style={styles.deleteBtnText}>Delete</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
    emptyText: { fontSize: Typography.sizes.md, color: c.textMuted },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.surfaceBorder,
    },
    headerCenter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    headerTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: c.text },
    badge: {
      backgroundColor: c.accent + '33',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    badgeText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: c.accent },

    filterRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
    },
    filterChip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      backgroundColor: c.surface,
    },
    filterChipActive: { borderColor: c.accent, backgroundColor: c.accent + '18' },
    filterChipText: { fontSize: Typography.sizes.sm, color: c.textSecondary, fontWeight: Typography.weights.medium },
    filterChipTextActive: { color: c.accent, fontWeight: Typography.weights.bold },

    list: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.xxl },

    card: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      borderLeftWidth: 3,
      borderLeftColor: c.accent + '66',
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    cardInactive: { borderLeftColor: c.textMuted, opacity: 0.7 },

    cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    ownerName: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: c.text },
    pillsRow: { flexDirection: 'row', gap: Spacing.xs },

    activePill: {
      backgroundColor: '#22C55E20',
      borderWidth: 1,
      borderColor: '#22C55E55',
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
    },
    activePillText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: '#22C55E' },
    inactivePill: {
      backgroundColor: c.textMuted + '20',
      borderWidth: 1,
      borderColor: c.textMuted + '55',
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
    },
    inactivePillText: { fontSize: Typography.sizes.xs, color: c.textMuted, fontWeight: Typography.weights.medium },
    expiredPill: {
      backgroundColor: c.danger + '20',
      borderWidth: 1,
      borderColor: c.danger + '55',
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
    },
    expiredPillText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: c.danger },

    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
    metaText: { fontSize: Typography.sizes.xs, color: c.textMuted },
    metaDot: { fontSize: Typography.sizes.xs, color: c.textMuted },

    description: { fontSize: Typography.sizes.sm, color: c.textSecondary, lineHeight: 19 },

    actions: { flexDirection: 'row', gap: Spacing.sm },
    deactivateBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
    },
    deactivateBtnText: { fontSize: Typography.sizes.sm, color: c.textSecondary, fontWeight: Typography.weights.medium },
    deleteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.danger + '55',
    },
    deleteBtnText: { fontSize: Typography.sizes.sm, color: c.danger, fontWeight: Typography.weights.semibold },
    btnDisabled: { opacity: 0.5 },
  });
}
