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
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/services/admin.service';
import { Report } from '@/types';

const REASON_META: Record<string, { label: string; color: string }> = {
  scam:          { label: 'Scam',          color: '#C43C3C' },
  harassment:    { label: 'Harassment',    color: '#D4823A' },
  spam:          { label: 'Spam',          color: '#C8A84B' },
  inappropriate: { label: 'Inappropriate', color: '#8B5CF6' },
  other:         { label: 'Other',         color: '#6B8FA3' },
};

const STATUS_FILTERS = [
  { id: undefined,    label: 'All' },
  { id: 'open',       label: 'Open' },
  { id: 'triaged',    label: 'Triaged' },
  { id: 'actioned',   label: 'Actioned' },
  { id: 'dismissed',  label: 'Dismissed' },
] as const;

const STATUS_COLORS: Record<string, string> = {
  open:      '#C43C3C',
  triaged:   '#C8A84B',
  actioned:  '#22C55E',
  dismissed: '#6B8FA3',
};

export default function AdminReportsScreen() {
  const { colors } = useTheme();
  const { profile: me } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Report['status'] | undefined>(undefined);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await adminService.fetchReports(statusFilter);
    setReports(data);
    setLoading(false);
    setRefreshing(false);
  }, [statusFilter]);

  React.useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const handleExpand = (r: Report) => {
    setExpanded(prev => (prev === r.id ? null : r.id));
    setResolution('');
  };

  const handleStatus = async (r: Report, status: Report['status']) => {
    setUpdating(r.id);
    const { error } = await adminService.updateReportStatus(r.id, status, resolution || undefined);
    setUpdating(null);
    if (error) {
      Alert.alert('Error', 'Could not update report.');
    } else {
      setReports(prev =>
        prev.map(rep =>
          rep.id === r.id
            ? { ...rep, status, resolved_at: status !== 'open' && status !== 'triaged' ? new Date().toISOString() : rep.resolved_at }
            : rep
        )
      );
      setExpanded(null);
    }
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

  const openCount = reports.filter(r => r.status === 'open').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Player Reports</Text>
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
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity
            key={String(f.id)}
            style={[styles.filterChip, statusFilter === f.id && styles.filterChipActive]}
            onPress={() => setStatusFilter(f.id as Report['status'] | undefined)}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterChipText, statusFilter === f.id && styles.filterChipTextActive]}>
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
          data={reports}
          keyExtractor={r => r.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="shield-checkmark-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>No reports found</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isExpanded = expanded === item.id;
            const isUpdating = updating === item.id;
            const reasonMeta = REASON_META[item.reason];
            const statusColor = STATUS_COLORS[item.status] ?? colors.textMuted;
            const reporter = item.reporter?.display_name ?? item.reporter?.username ?? 'Unknown';
            const reported = item.reported_user?.display_name ?? item.reported_user?.username ?? 'Unknown';

            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => handleExpand(item)}
                activeOpacity={0.85}
              >
                {/* Pills row */}
                <View style={styles.cardTop}>
                  <View style={[styles.pill, { borderColor: reasonMeta.color + '55', backgroundColor: reasonMeta.color + '15' }]}>
                    <Text style={[styles.pillText, { color: reasonMeta.color }]}>{reasonMeta.label}</Text>
                  </View>
                  <View style={[styles.pill, { borderColor: statusColor + '55', backgroundColor: statusColor + '15' }]}>
                    <Text style={[styles.pillText, { color: statusColor }]}>{item.status}</Text>
                  </View>
                </View>

                {/* Reporter → Reported */}
                <View style={styles.partiesRow}>
                  <Text style={styles.partyLabel}>Reporter: </Text>
                  <Text style={styles.partyName}>{reporter}</Text>
                  <Ionicons name="arrow-forward" size={12} color={colors.textMuted} style={{ marginHorizontal: 4 }} />
                  <Text style={styles.partyLabel}>Reported: </Text>
                  <Text style={[styles.partyName, { color: colors.danger }]}>{reported}</Text>
                </View>

                {/* Details */}
                {item.details ? (
                  <Text style={styles.details} numberOfLines={isExpanded ? undefined : 2}>
                    {item.details}
                  </Text>
                ) : null}

                <Text style={styles.dateText}>
                  {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>

                {/* Expanded actions */}
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    <Text style={styles.editLabel}>RESOLUTION NOTE (OPTIONAL)</Text>
                    <TextInput
                      style={styles.noteInput}
                      value={resolution}
                      onChangeText={setResolution}
                      placeholder="Add a note..."
                      placeholderTextColor={colors.textMuted}
                      multiline
                      numberOfLines={2}
                    />
                    <View style={styles.actionGrid}>
                      {(['open', 'triaged', 'actioned', 'dismissed'] as Report['status'][])
                        .filter(s => s !== item.status)
                        .map(s => (
                          <TouchableOpacity
                            key={s}
                            style={[
                              styles.actionBtn,
                              { borderColor: (STATUS_COLORS[s] ?? colors.textMuted) + '55' },
                              isUpdating && styles.btnDisabled,
                            ]}
                            onPress={() => handleStatus(item, s)}
                            disabled={isUpdating}
                            activeOpacity={0.8}
                          >
                            {isUpdating ? (
                              <ActivityIndicator size="small" color={STATUS_COLORS[s] ?? colors.textMuted} />
                            ) : (
                              <Text style={[styles.actionBtnText, { color: STATUS_COLORS[s] ?? colors.textMuted }]}>
                                → {s}
                              </Text>
                            )}
                          </TouchableOpacity>
                        ))}
                    </View>
                  </View>
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
    headerTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: c.text },
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
      flexWrap: 'wrap',
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
      borderLeftColor: c.danger + '80',
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    pill: {
      borderWidth: 1,
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
    },
    pillText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold },

    partiesRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
    partyLabel: { fontSize: Typography.sizes.xs, color: c.textMuted },
    partyName: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold, color: c.text },

    details: { fontSize: Typography.sizes.sm, color: c.textSecondary, lineHeight: 19 },
    dateText: { fontSize: Typography.sizes.xs, color: c.textMuted },

    expandedContent: {
      gap: Spacing.sm,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: c.surfaceBorder,
    },
    editLabel: {
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.weights.bold,
      color: c.textMuted,
      letterSpacing: 1.2,
    },
    noteInput: {
      backgroundColor: c.surfaceElevated,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      fontSize: Typography.sizes.sm,
      color: c.text,
      minHeight: 60,
      textAlignVertical: 'top',
    },
    actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    actionBtn: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      backgroundColor: c.surfaceElevated,
    },
    actionBtnText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
    btnDisabled: { opacity: 0.5 },
  });
}
