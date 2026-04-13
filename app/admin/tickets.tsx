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
import { supportService, SupportCategory } from '@/services/support.service';
import { SupportTicket } from '@/types';

const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  bug:     { label: 'Bug',     icon: 'bug-outline',      color: '#C43C3C' },
  feature: { label: 'Feature', icon: 'bulb-outline',     color: '#C8A84B' },
  content: { label: 'Content', icon: 'flag-outline',     color: '#D4823A' },
  other:   { label: 'Other',   icon: 'chatbox-outline',  color: '#6B8FA3' },
};

const STATUS_FILTERS = [
  { id: undefined,    label: 'All' },
  { id: 'open',       label: 'Open' },
  { id: 'resolved',   label: 'Resolved' },
] as const;

const CATEGORY_FILTERS = [
  { id: undefined,    label: 'All' },
  { id: 'bug',        label: 'Bug' },
  { id: 'feature',    label: 'Feature' },
  { id: 'content',    label: 'Content' },
  { id: 'other',      label: 'Other' },
] as const;

export default function AdminTicketsScreen() {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'open' | 'resolved' | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<SupportCategory | undefined>(undefined);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supportService.fetchTickets({
      status: statusFilter,
      category: categoryFilter,
    });
    setTickets(data);
    setLoading(false);
  }, [statusFilter, categoryFilter]);

  React.useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const toggleStatus = async (ticket: SupportTicket) => {
    const next = ticket.status === 'open' ? 'resolved' : 'open';
    setUpdating(ticket.id);
    const { error } = await supportService.updateStatus(ticket.id, next);
    setUpdating(null);
    if (error) {
      Alert.alert('Error', 'Could not update ticket status.');
    } else {
      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, status: next } : t)),
      );
    }
  };

  // Guard — should never reach this screen if not admin, but just in case
  if (!profile?.is_admin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="lock-closed-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyText}>Access denied</Text>
        </View>
      </SafeAreaView>
    );
  }

  const openCount = tickets.filter((t) => t.status === 'open').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Support Tickets</Text>
          {openCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{openCount}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 22 }} />
      </View>

      {/* Status filter */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={String(f.id)}
            style={[styles.filterChip, statusFilter === f.id && styles.filterChipActive]}
            onPress={() => setStatusFilter(f.id)}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterChipText, statusFilter === f.id && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category filter */}
      <View style={styles.filterRow}>
        {CATEGORY_FILTERS.map((f) => (
          <TouchableOpacity
            key={String(f.id)}
            style={[styles.filterChip, categoryFilter === f.id && styles.filterChipActive]}
            onPress={() => setCategoryFilter(f.id as SupportCategory | undefined)}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterChipText, categoryFilter === f.id && styles.filterChipTextActive]}>
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
          data={tickets}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="checkmark-circle-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>No tickets found</Text>
            </View>
          }
          renderItem={({ item }) => {
            const meta = CATEGORY_META[item.category];
            const isExpanded = expanded === item.id;
            const isUpdating = updating === item.id;
            const isResolved = item.status === 'resolved';
            const submitter = item.profiles?.display_name ?? item.profiles?.username ?? 'Unknown';

            return (
              <TouchableOpacity
                style={[styles.card, isResolved && styles.cardResolved]}
                onPress={() => setExpanded(isExpanded ? null : item.id)}
                activeOpacity={0.85}
              >
                {/* Top row */}
                <View style={styles.cardTop}>
                  <View style={[styles.categoryPill, { borderColor: meta.color + '55', backgroundColor: meta.color + '15' }]}>
                    <Ionicons name={meta.icon as any} size={12} color={meta.color} />
                    <Text style={[styles.categoryPillText, { color: meta.color }]}>{meta.label}</Text>
                  </View>

                  <View style={[styles.statusPill, isResolved && styles.statusPillResolved]}>
                    <Text style={[styles.statusPillText, isResolved && styles.statusPillTextResolved]}>
                      {isResolved ? 'Resolved' : 'Open'}
                    </Text>
                  </View>
                </View>

                {/* User + date */}
                <View style={styles.metaRow}>
                  <Ionicons name="person-outline" size={12} color={colors.textMuted} />
                  <Text style={styles.metaText}>{submitter}</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.metaText}>
                    {new Date(item.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </Text>
                </View>

                {/* Message — collapsed shows 2 lines, expanded shows all */}
                <Text style={styles.message} numberOfLines={isExpanded ? undefined : 2}>
                  {item.message}
                </Text>

                {/* Actions — only visible when expanded */}
                {isExpanded && (
                  <TouchableOpacity
                    style={[styles.actionBtn, isResolved && styles.actionBtnReopen]}
                    onPress={() => toggleStatus(item)}
                    disabled={isUpdating}
                    activeOpacity={0.8}
                  >
                    {isUpdating ? (
                      <ActivityIndicator size="small" color={colors.background} />
                    ) : (
                      <>
                        <Ionicons
                          name={isResolved ? 'refresh-outline' : 'checkmark-circle-outline'}
                          size={15}
                          color={colors.background}
                        />
                        <Text style={styles.actionBtnText}>
                          {isResolved ? 'Re-open' : 'Mark Resolved'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
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
    headerTitle: {
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.weights.bold,
      color: c.text,
    },
    badge: {
      backgroundColor: c.danger,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    badgeText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: '#fff' },

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

    list: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl },

    card: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      borderLeftWidth: 3,
      borderLeftColor: c.accent,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    cardResolved: { borderLeftColor: c.textMuted, opacity: 0.75 },

    cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    categoryPill: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      borderWidth: 1, borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm, paddingVertical: 3,
    },
    categoryPillText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold },

    statusPill: {
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm, paddingVertical: 3,
      backgroundColor: c.danger + '20',
      borderWidth: 1, borderColor: c.danger + '55',
    },
    statusPillResolved: { backgroundColor: c.success + '20', borderColor: c.success + '55' },
    statusPillText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: c.danger },
    statusPillTextResolved: { color: c.success },

    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: Typography.sizes.xs, color: c.textMuted },
    metaDot: { fontSize: Typography.sizes.xs, color: c.textMuted },

    message: {
      fontSize: Typography.sizes.sm,
      color: c.textSecondary,
      lineHeight: 20,
    },

    actionBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: Spacing.sm,
      backgroundColor: c.success,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.sm,
      marginTop: Spacing.xs,
    },
    actionBtnReopen: { backgroundColor: c.textMuted },
    actionBtnText: {
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.weights.bold,
      color: c.background,
    },
  });
}
