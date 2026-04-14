import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { CATEGORY_META } from '@/constants/categories';
import { priceHistoryService } from '@/services/priceHistory.service';
import { timeAgo } from '@/utils/dateFormat';
import { Category, PriceHistoryEntry } from '@/types';

// One entry per unique item_name — most recent entry wins
interface ItemSummary {
  item_name: string;
  latest_price: string | null;
  trade_count: number;
  latest_at: string;
}

function buildItemSummaries(entries: PriceHistoryEntry[]): ItemSummary[] {
  const map = new Map<string, ItemSummary>();
  for (const e of entries) {
    const existing = map.get(e.item_name);
    if (!existing) {
      map.set(e.item_name, {
        item_name: e.item_name,
        latest_price: e.want_in_return,
        trade_count: 1,
        latest_at: e.completed_at,
      });
    } else {
      existing.trade_count += 1;
      // entries are already ordered newest-first from the service
    }
  }
  return Array.from(map.values());
}

export default function CategoryPriceListScreen() {
  const { cat } = useLocalSearchParams<{ cat: string }>();
  const category = cat as Category;
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const meta = CATEGORY_META[category];
  const accentColor = meta?.color ?? colors.accent;

  const [allEntries, setAllEntries] = useState<PriceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const data = await priceHistoryService.getRecentByCategory(category, 200);
    setAllEntries(data);
    setLoading(false);
  }, [category]);

  useEffect(() => { load(); }, [load]);

  const items = useMemo(() => {
    const summaries = buildItemSummaries(allEntries);
    if (!search.trim()) return summaries;
    const q = search.trim().toLowerCase();
    return summaries.filter((s) => s.item_name.toLowerCase().includes(q));
  }, [allEntries, search]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.75}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
          <Text style={styles.backLabel}>Back</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {meta && (
            <View style={[styles.catPill, { backgroundColor: accentColor + '22' }]}>
              <Ionicons name={meta.icon as any} size={12} color={accentColor} />
              <Text style={[styles.catPillText, { color: accentColor }]}>
                {category?.toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.headerTitle}>Price History</Text>
          <Text style={styles.headerSub}>
            {loading ? 'Loading...' : `${items.length} item${items.length !== 1 ? 's' : ''} traded`}
          </Text>
        </View>

        <View style={styles.backBtn} />
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={`Search ${category} items...`}
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={accentColor} size="large" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.item_name}
          contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.list}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="analytics-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>
                {search ? 'No matches' : 'No price data yet'}
              </Text>
              <Text style={styles.emptyBody}>
                {search
                  ? `No ${category} items matching "${search}"`
                  : `Completed trades for ${category} will appear here.`}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.itemRow}
              activeOpacity={0.8}
              onPress={() =>
                router.push(
                  `/price-history/${encodeURIComponent(item.item_name)}?category=${category}`
                )
              }
            >
              <View style={[styles.itemAccent, { backgroundColor: accentColor }]} />

              <View style={styles.itemBody}>
                <Text style={styles.itemName} numberOfLines={1}>{item.item_name}</Text>
                <View style={styles.itemMeta}>
                  {item.latest_price ? (
                    <View style={styles.priceWrap}>
                      <Ionicons name="swap-horizontal" size={11} color={colors.textMuted} />
                      <Text style={styles.priceText} numberOfLines={1}>{item.latest_price}</Text>
                    </View>
                  ) : (
                    <Text style={styles.noPriceText}>No price recorded</Text>
                  )}
                </View>
              </View>

              <View style={styles.itemRight}>
                <View style={[styles.tradeCountPill, { backgroundColor: accentColor + '20' }]}>
                  <Text style={[styles.tradeCountText, { color: accentColor }]}>
                    {item.trade_count} trade{item.trade_count !== 1 ? 's' : ''}
                  </Text>
                </View>
                <Text style={styles.itemTime}>{timeAgo(item.latest_at)}</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },

    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.surfaceBorder,
      paddingHorizontal: Spacing.md,
      paddingTop: 64,
      paddingBottom: Spacing.lg,
      gap: Spacing.sm,
    },
    backBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      width: 60,
    },
    backLabel: {
      fontSize: Typography.sizes.sm,
      color: c.text,
      fontWeight: Typography.weights.semibold,
    },
    headerCenter: { flex: 1, alignItems: 'center', gap: 4, marginTop: 10 },
    catPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: BorderRadius.full,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    catPillText: { fontSize: 10, fontWeight: Typography.weights.bold, letterSpacing: 0.8 },
    headerTitle: {
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.weights.bold,
      color: c.text,
    },
    headerSub: { fontSize: Typography.sizes.xs, color: c.textMuted, letterSpacing: 0.5 },

    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.surfaceBorder,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 2,
    },
    searchInput: {
      flex: 1,
      fontSize: Typography.sizes.sm,
      color: c.text,
      paddingVertical: 2,
    },

    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    list: { paddingVertical: Spacing.sm, paddingBottom: Spacing.xl },
    emptyContainer: { flex: 1 },
    separator: { height: 1, backgroundColor: c.surfaceBorder, marginLeft: Spacing.md + 3 + Spacing.sm },

    emptyWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.xl,
      gap: Spacing.md,
      paddingTop: Spacing.xxl,
    },
    emptyTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: c.textSecondary },
    emptyBody: { fontSize: Typography.sizes.sm, color: c.textMuted, textAlign: 'center', lineHeight: 20 },

    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      backgroundColor: c.background,
      gap: Spacing.sm,
    },
    itemAccent: { width: 3, height: 40, borderRadius: 2, flexShrink: 0 },
    itemBody: { flex: 1, gap: 4 },
    itemName: {
      fontSize: Typography.sizes.md,
      fontWeight: Typography.weights.semibold,
      color: c.text,
    },
    itemMeta: { flexDirection: 'row', alignItems: 'center' },
    priceWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    priceText: { fontSize: Typography.sizes.xs, color: c.textSecondary },
    noPriceText: { fontSize: Typography.sizes.xs, color: c.textMuted, fontStyle: 'italic' },
    itemRight: { alignItems: 'flex-end', gap: 4 },
    tradeCountPill: {
      borderRadius: BorderRadius.full,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    tradeCountText: { fontSize: 10, fontWeight: Typography.weights.bold },
    itemTime: { fontSize: 10, color: c.textMuted },
  });
}
