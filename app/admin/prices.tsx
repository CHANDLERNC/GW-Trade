import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
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
import { priceHistoryService } from '@/services/priceHistory.service';
import { PriceHistoryEntry } from '@/types';
import { timeAgo } from '@/utils/dateFormat';

export default function AdminPricesScreen() {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [entries, setEntries] = useState<PriceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async (q?: string) => {
    const data = await priceHistoryService.adminGetAll(q);
    setEntries(data);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(search);
    setRefreshing(false);
  }, [load, search]);

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    load(q);
  }, [load]);

  const handleExpand = (entry: PriceHistoryEntry) => {
    if (expanded === entry.id) {
      setExpanded(null);
    } else {
      setExpanded(entry.id);
      setEditValue(entry.want_in_return ?? '');
    }
  };

  const handleSave = async (entry: PriceHistoryEntry) => {
    setSaving(entry.id);
    const { error } = await priceHistoryService.adminUpdate(entry.id, editValue);
    setSaving(null);
    if (error) {
      Alert.alert('Error', 'Could not update price.');
    } else {
      setEntries(prev =>
        prev.map(e => e.id === entry.id ? { ...e, want_in_return: editValue.trim() || null } : e)
      );
      setExpanded(null);
    }
  };

  const handleDelete = (entry: PriceHistoryEntry) => {
    Alert.alert(
      'Delete Entry',
      `Remove this sale record for "${entry.key_name ?? entry.item_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(entry.id);
            const { error } = await priceHistoryService.adminDelete(entry.id);
            setDeleting(null);
            if (error) {
              Alert.alert('Error', 'Could not delete entry.');
            } else {
              setEntries(prev => prev.filter(e => e.id !== entry.id));
              setExpanded(null);
            }
          },
        },
      ]
    );
  };

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Sold Prices</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{entries.length}</Text>
          </View>
        </View>
        <View style={{ width: 22 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={15} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={handleSearch}
          placeholder="Filter by key name..."
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={e => e.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="trending-up-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>No sale records found</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isExpanded = expanded === item.id;
            const isSaving = saving === item.id;
            const isDeleting = deleting === item.id;

            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => handleExpand(item)}
                activeOpacity={0.85}
              >
                {/* Key name */}
                <Text style={styles.keyName} numberOfLines={isExpanded ? undefined : 1}>
                  {item.key_name ?? item.item_name}
                </Text>

                {/* Price + date row */}
                <View style={styles.metaRow}>
                  <View style={styles.priceChip}>
                    <Ionicons name="swap-horizontal" size={11} color={colors.accent} />
                    <Text style={styles.priceText} numberOfLines={1}>
                      {item.want_in_return ?? 'No price recorded'}
                    </Text>
                  </View>
                  <Text style={styles.dateText}>{timeAgo(item.completed_at)}</Text>
                </View>

                {/* Expanded: edit + delete */}
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    <Text style={styles.editLabel}>EDIT SOLD PRICE</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editValue}
                      onChangeText={setEditValue}
                      placeholder="e.g. 50,000 Rubles"
                      placeholderTextColor={colors.textMuted}
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={() => handleSave(item)}
                    />
                    <View style={styles.expandedActions}>
                      <TouchableOpacity
                        style={[styles.deleteBtn, isDeleting && styles.btnDisabled]}
                        onPress={() => handleDelete(item)}
                        disabled={isDeleting || isSaving}
                        activeOpacity={0.8}
                      >
                        {isDeleting ? (
                          <ActivityIndicator size="small" color={colors.danger} />
                        ) : (
                          <>
                            <Ionicons name="trash-outline" size={14} color={colors.danger} />
                            <Text style={styles.deleteBtnText}>Delete</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.saveBtn, isSaving && styles.btnDisabled]}
                        onPress={() => handleSave(item)}
                        disabled={isSaving || isDeleting}
                        activeOpacity={0.8}
                      >
                        {isSaving ? (
                          <ActivityIndicator size="small" color={colors.background} />
                        ) : (
                          <Text style={styles.saveBtnText}>Save</Text>
                        )}
                      </TouchableOpacity>
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
    headerTitle: {
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.weights.bold,
      color: c.text,
    },
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

    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      marginHorizontal: Spacing.lg,
      marginVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      height: 42,
    },
    searchInput: {
      flex: 1,
      fontSize: Typography.sizes.sm,
      color: c.text,
      padding: 0,
    },

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
    keyName: {
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.weights.semibold,
      color: c.text,
      lineHeight: 20,
    },
    metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
    priceChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: c.accent + '18',
      borderRadius: BorderRadius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      flexShrink: 1,
    },
    priceText: {
      fontSize: Typography.sizes.xs,
      color: c.accent,
      fontWeight: Typography.weights.semibold,
      flexShrink: 1,
    },
    dateText: { fontSize: Typography.sizes.xs, color: c.textMuted, flexShrink: 0 },

    expandedContent: { gap: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: c.surfaceBorder },
    editLabel: {
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.weights.bold,
      color: c.textMuted,
      letterSpacing: 1.2,
    },
    editInput: {
      backgroundColor: c.surfaceElevated,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      fontSize: Typography.sizes.sm,
      color: c.text,
      height: 44,
    },
    expandedActions: { flexDirection: 'row', gap: Spacing.sm },
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
    deleteBtnText: {
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.weights.semibold,
      color: c.danger,
    },
    saveBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      backgroundColor: c.accent,
    },
    saveBtnText: {
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.weights.bold,
      color: c.background,
    },
    btnDisabled: { opacity: 0.5 },
  });
}
