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
import { adminService } from '@/services/admin.service';
import { Listing } from '@/types';
import { timeAgo } from '@/utils/dateFormat';

export default function AdminListingsScreen() {
  const { colors } = useTheme();
  const { profile: me } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async (q?: string) => {
    const { data } = await adminService.fetchAllListings(q ?? search);
    setListings(data);
    setLoading(false);
    setRefreshing(false);
  }, [search]);

  React.useEffect(() => {
    setLoading(true);
    load('');
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    load(q);
  }, [load]);

  const handleDelete = (item: Listing) => {
    const owner = (item.profiles as any)?.display_name ?? (item.profiles as any)?.username ?? 'Unknown';
    Alert.alert(
      'Delete Listing',
      `Delete "${item.title}" by ${owner}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(item.id);
            const { error } = await adminService.deleteListing(item.id);
            setDeleting(null);
            if (error) {
              Alert.alert('Error', 'Could not delete listing.');
            } else {
              setListings(prev => prev.filter(l => l.id !== item.id));
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
          <Text style={styles.headerTitle}>All Listings</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{listings.length}</Text>
          </View>
        </View>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={15} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={handleSearch}
          placeholder="Filter by title..."
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
          data={listings}
          keyExtractor={l => l.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="list-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>No listings found</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isDeleting = deleting === item.id;
            const owner = (item.profiles as any)?.display_name ?? (item.profiles as any)?.username ?? 'Unknown';

            return (
              <View style={[styles.card, !item.is_active && styles.cardInactive]}>
                <View style={styles.cardTop}>
                  <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                  {!item.is_active && (
                    <View style={styles.inactivePill}>
                      <Text style={styles.inactivePillText}>Inactive</Text>
                    </View>
                  )}
                </View>

                <View style={styles.metaRow}>
                  <Ionicons name="person-outline" size={11} color={colors.textMuted} />
                  <Text style={styles.metaText}>{owner}</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.metaText}>{item.category}</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.metaText}>{item.faction}</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.metaText}>{timeAgo(item.created_at)}</Text>
                </View>

                {item.want_in_return ? (
                  <View style={styles.priceChip}>
                    <Ionicons name="swap-horizontal" size={11} color={colors.accent} />
                    <Text style={styles.priceText} numberOfLines={1}>{item.want_in_return}</Text>
                  </View>
                ) : null}

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.viewBtn]}
                    onPress={() => router.push(`/listing/${item.id}`)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="eye-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.viewBtnText}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteBtn, isDeleting && styles.btnDisabled]}
                    onPress={() => handleDelete(item)}
                    disabled={isDeleting}
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
    searchInput: { flex: 1, fontSize: Typography.sizes.sm, color: c.text, padding: 0 },

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

    cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
    title: { flex: 1, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: c.text },

    inactivePill: {
      backgroundColor: c.textMuted + '20',
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: c.textMuted + '55',
    },
    inactivePillText: { fontSize: Typography.sizes.xs, color: c.textMuted, fontWeight: Typography.weights.medium },

    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: Typography.sizes.xs, color: c.textMuted },
    metaDot: { fontSize: Typography.sizes.xs, color: c.textMuted },

    priceChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
      backgroundColor: c.accent + '18',
      borderRadius: BorderRadius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
    },
    priceText: { fontSize: Typography.sizes.xs, color: c.accent, fontWeight: Typography.weights.semibold },

    actions: { flexDirection: 'row', gap: Spacing.sm },
    viewBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
    },
    viewBtnText: { fontSize: Typography.sizes.sm, color: c.textSecondary, fontWeight: Typography.weights.medium },
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
