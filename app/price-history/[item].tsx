import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { CATEGORY_META } from '@/constants/categories';
import { FACTION_LIST } from '@/constants/factions';
import { priceHistoryService } from '@/services/priceHistory.service';
import { timeAgo } from '@/utils/dateFormat';
import { Category, PriceHistoryEntry } from '@/types';

function buildPriceSummary(entries: PriceHistoryEntry[]): Array<{ label: string; count: number }> {
  const counts: Record<string, number> = {};
  for (const e of entries) {
    const key = e.want_in_return?.trim() ?? '';
    if (!key) continue;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label, count }));
}

// Deduplicate a list of entries by item_name, keeping the most recent per item
function deduplicateByItem(entries: PriceHistoryEntry[]): PriceHistoryEntry[] {
  const seen = new Set<string>();
  return entries.filter((e) => {
    if (seen.has(e.item_name)) return false;
    seen.add(e.item_name);
    return true;
  });
}

export default function PriceHistoryScreen() {
  const { item, category } = useLocalSearchParams<{ item: string; category: string }>();
  const itemName = decodeURIComponent(item ?? '');
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [history, setHistory] = useState<PriceHistoryEntry[]>([]);
  const [otherItems, setOtherItems] = useState<PriceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const cat = category as Category | undefined;
  const meta = cat && CATEGORY_META[cat] ? CATEGORY_META[cat] : null;
  const accentColor = meta?.color ?? colors.accent;

  const load = useCallback(async () => {
    setLoading(true);
    const [itemHistory, catHistory] = await Promise.all([
      priceHistoryService.getItemPriceHistory(itemName),
      // Only keys have price tracking — skip category fetch for gear/items
      cat === 'keys' ? priceHistoryService.getRecentByCategory(cat) : Promise.resolve([]),
    ]);
    setHistory(itemHistory);
    const others = deduplicateByItem(
      catHistory.filter((e) => e.item_name !== itemName)
    ).slice(0, 6);
    setOtherItems(others);
    setLoading(false);
  }, [itemName, cat]);

  useEffect(() => { load(); }, [load]);

  const summary = useMemo(() => buildPriceSummary(history), [history]);

  const ListFooter = useMemo(() => {
    if (!cat || otherItems.length === 0) return null;
    return (
      <View style={styles.otherSection}>
        <View style={styles.otherHeader}>
          <View style={styles.otherHeaderLeft}>
            {meta && <Ionicons name={meta.icon as any} size={13} color={accentColor} />}
            <Text style={[styles.otherTitle, { color: accentColor }]}>
              OTHER {cat.toUpperCase()} ITEMS SOLD
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push(`/price-history/category/${cat}`)}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.seeAllLink, { color: accentColor }]}>See all →</Text>
          </TouchableOpacity>
        </View>

        {otherItems.map((entry) => (
          <TouchableOpacity
            key={entry.id}
            style={styles.otherRow}
            activeOpacity={0.8}
            onPress={() =>
              router.push(
                `/price-history/${encodeURIComponent(entry.item_name)}?category=${cat}`
              )
            }
          >
            <View style={[styles.otherRowAccent, { backgroundColor: accentColor }]} />
            <View style={styles.otherRowBody}>
              <Text style={styles.otherRowName} numberOfLines={1}>{entry.item_name}</Text>
              {entry.want_in_return ? (
                <Text style={styles.otherRowPrice} numberOfLines={1}>
                  {entry.want_in_return}
                </Text>
              ) : null}
            </View>
            <View style={styles.otherRowRight}>
              <Text style={styles.otherRowTime}>{timeAgo(entry.completed_at)}</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.seeAllBtn, { borderColor: accentColor + '55' }]}
          activeOpacity={0.8}
          onPress={() => router.push(`/price-history/category/${cat}`)}
        >
          <Text style={[styles.seeAllBtnText, { color: accentColor }]}>
            Browse all {cat} price data
          </Text>
          <Ionicons name="arrow-forward" size={14} color={accentColor} />
        </TouchableOpacity>
      </View>
    );
  }, [otherItems, cat, accentColor, meta, colors, styles]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />

      {/* Custom header */}
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
                {cat?.toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.headerTitle} numberOfLines={2}>{itemName}</Text>
          <Text style={styles.headerSub}>Recent Sale Prices</Text>
        </View>

        {/* spacer to balance back button */}
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={accentColor} size="large" />
        </View>
      ) : history.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="analytics-outline" size={44} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No price data yet</Text>
          <Text style={styles.emptyBody}>
            Completed trades for this item will appear here once sellers confirm them.
          </Text>
          {cat && (
            <TouchableOpacity
              style={[styles.seeAllBtn, { borderColor: accentColor + '55' }]}
              onPress={() => router.push(`/price-history/category/${cat}`)}
              activeOpacity={0.8}
            >
              <Text style={[styles.seeAllBtnText, { color: accentColor }]}>
                Browse other {cat} items
              </Text>
              <Ionicons name="arrow-forward" size={14} color={accentColor} />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            summary.length > 0 ? (
              <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                  <Ionicons name="bar-chart-outline" size={14} color={accentColor} />
                  <Text style={[styles.summaryTitle, { color: accentColor }]}>AVG SALE PRICES</Text>
                  <Text style={styles.summarySubtitle}>
                    ({history.length} trade{history.length !== 1 ? 's' : ''})
                  </Text>
                </View>
                <View style={styles.summaryRows}>
                  {summary.map((s, i) => (
                    <View key={s.label} style={styles.summaryRow}>
                      <View style={styles.summaryRankWrap}>
                        <Text style={[styles.summaryRank, { color: i === 0 ? accentColor : colors.textMuted }]}>
                          #{i + 1}
                        </Text>
                      </View>
                      <Text style={styles.summaryLabel} numberOfLines={1}>{s.label}</Text>
                      <View style={[styles.summaryCountPill, { backgroundColor: accentColor + '20' }]}>
                        <Text style={[styles.summaryCount, { color: accentColor }]}>
                          {s.count}×
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : null
          }
          ListFooterComponent={ListFooter}
          renderItem={({ item: entry }) => {
            const faction = FACTION_LIST.find((f) => f.id === entry.faction);
            return (
              <View style={styles.tradeRow}>
                <View style={[styles.tradeRowAccent, { backgroundColor: accentColor }]} />
                <View style={styles.tradeRowBody}>
                  <View style={styles.tradeRowTop}>
                    <Text style={styles.tradeRowItem} numberOfLines={1}>{entry.item_name}</Text>
                    <Text style={styles.tradeRowTime}>{timeAgo(entry.completed_at)}</Text>
                  </View>
                  <View style={styles.tradeRowMeta}>
                    {entry.want_in_return ? (
                      <View style={styles.priceWrap}>
                        <Ionicons name="swap-horizontal" size={11} color={colors.textMuted} />
                        <Text style={styles.priceText}>{entry.want_in_return}</Text>
                      </View>
                    ) : (
                      <Text style={styles.noPriceText}>No price listed</Text>
                    )}
                    {faction && (
                      <View style={[styles.factionPill, { backgroundColor: faction.color + '20', borderColor: faction.color + '55' }]}>
                        <Text style={[styles.factionPillText, { color: faction.color }]}>
                          {faction.shortName}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
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
      textAlign: 'center',
      lineHeight: 22,
    },
    headerSub: { fontSize: Typography.sizes.xs, color: c.textMuted, letterSpacing: 0.5 },

    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    emptyWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.xl,
      gap: Spacing.md,
    },
    emptyTitle: {
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.weights.bold,
      color: c.textSecondary,
    },
    emptyBody: {
      fontSize: Typography.sizes.sm,
      color: c.textMuted,
      textAlign: 'center',
      lineHeight: 20,
    },

    list: { padding: Spacing.lg, gap: Spacing.sm },

    summaryCard: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      gap: Spacing.md,
    },
    summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    summaryTitle: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, letterSpacing: 1.5 },
    summarySubtitle: { fontSize: Typography.sizes.xs, color: c.textMuted, marginLeft: 2 },
    summaryRows: { gap: Spacing.xs },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: 4,
      borderBottomWidth: 1,
      borderBottomColor: c.surfaceBorder,
    },
    summaryRankWrap: { width: 24 },
    summaryRank: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, letterSpacing: 0.5 },
    summaryLabel: { flex: 1, fontSize: Typography.sizes.sm, color: c.text },
    summaryCountPill: { borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 2 },
    summaryCount: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold },

    tradeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: Spacing.sm,
      overflow: 'hidden',
    },
    tradeRowAccent: { width: 3, borderRadius: 2, alignSelf: 'stretch' },
    tradeRowBody: { flex: 1, gap: 4 },
    tradeRowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    tradeRowItem: { flex: 1, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: c.text },
    tradeRowTime: { fontSize: 10, color: c.textMuted, marginLeft: Spacing.xs },
    tradeRowMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    priceWrap: { flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1 },
    priceText: { fontSize: Typography.sizes.xs, color: c.textSecondary, flex: 1 },
    noPriceText: { fontSize: Typography.sizes.xs, color: c.textMuted, fontStyle: 'italic' },
    factionPill: { borderRadius: BorderRadius.full, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1 },
    factionPillText: { fontSize: 9, fontWeight: Typography.weights.bold, letterSpacing: 0.5 },

    // Other items section
    otherSection: {
      marginTop: Spacing.lg,
      backgroundColor: c.surface,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      overflow: 'hidden',
    },
    otherHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: c.surfaceBorder,
    },
    otherHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    otherTitle: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, letterSpacing: 1.2 },
    seeAllLink: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },
    otherRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: c.surfaceBorder,
      gap: Spacing.sm,
    },
    otherRowAccent: { width: 3, height: 32, borderRadius: 2 },
    otherRowBody: { flex: 1, gap: 2 },
    otherRowName: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: c.text },
    otherRowPrice: { fontSize: Typography.sizes.xs, color: c.textMuted },
    otherRowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    otherRowTime: { fontSize: 10, color: c.textMuted },
    seeAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      marginTop: Spacing.sm,
    },
    seeAllBtnText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  });
}
