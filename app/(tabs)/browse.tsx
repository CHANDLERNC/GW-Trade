import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { ListingCard } from '@/components/listings/ListingCard';
import { useListings } from '@/hooks/useListings';
import { FACTION_LIST } from '@/constants/factions';
import { CATEGORY_LIST } from '@/constants/categories';
import { Category, FactionSlug } from '@/types';

type CategoryFilter = Category | 'all';
type FactionFilter = FactionSlug | 'all';

export default function BrowseScreen() {
  const params = useLocalSearchParams<{ category?: string; faction?: string }>();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(
    (params.category as Category) ?? 'all'
  );
  const [factionFilter, setFactionFilter] = useState<FactionFilter>(
    (params.faction as FactionSlug) ?? 'all'
  );

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const isSearching = search !== debouncedSearch;

  const { listings, loading, refreshing, refetch } = useListings({
    category: categoryFilter,
    faction: factionFilter,
    search: debouncedSearch || undefined,
    activeOnly: true,
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.title}>Browse</Text>
        {listings.length > 0 && (
          <Text style={styles.count}>{listings.length} listings</Text>
        )}
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search listings..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {isSearching && (
          <ActivityIndicator size="small" color={colors.textMuted} style={styles.searchSpinner} />
        )}
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Category</Text>
        <View style={styles.filterRow}>
          {[{ id: 'all', name: 'All' }, ...CATEGORY_LIST].map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.filterChip,
                categoryFilter === cat.id && styles.filterChipActive,
              ]}
              onPress={() => { Keyboard.dismiss(); setCategoryFilter(cat.id as CategoryFilter); }}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterChipText,
                  categoryFilter === cat.id && styles.filterChipTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Faction</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          contentContainerStyle={styles.filterRowScroll}
        >
          {[{ id: 'all', shortName: 'All', color: colors.textMuted }, ...FACTION_LIST].map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.filterChip,
                factionFilter === f.id && styles.filterChipActive,
                factionFilter === f.id && { borderColor: (f as any).color ?? colors.accent },
              ]}
              onPress={() => { Keyboard.dismiss(); setFactionFilter(f.id as FactionFilter); }}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterChipText,
                  factionFilter === f.id && {
                    color: (f as any).color ?? colors.accent,
                    fontWeight: Typography.weights.bold,
                  },
                ]}
              >
                {(f as any).shortName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ListingCard listing={item} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onRefresh={refetch}
          refreshing={refreshing}
          keyboardDismissMode="on-drag"
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search" size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No listings found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your filters or be the first to post one.
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
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
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
    },
    title: {
      fontSize: Typography.sizes.xxl,
      fontWeight: Typography.weights.bold,
      color: c.text,
    },
    count: { fontSize: Typography.sizes.sm, color: c.textMuted },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
      paddingHorizontal: Spacing.md,
      height: 44,
    },
    searchIcon: { marginRight: Spacing.sm },
    searchInput: {
      flex: 1,
      fontSize: Typography.sizes.md,
      color: c.text,
      height: '100%',
    },
    searchSpinner: { marginLeft: Spacing.xs },
    filterSection: {
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.sm,
      gap: Spacing.xs,
    },
    filterLabel: {
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.weights.bold,
      color: c.textMuted,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    filterRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
    filterRowScroll: { flexDirection: 'row', gap: Spacing.xs },
    filterChip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: 6,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      backgroundColor: c.surface,
    },
    filterChipActive: {
      borderColor: c.accent,
      backgroundColor: c.accent + '15',
    },
    filterChipText: {
      fontSize: Typography.sizes.sm,
      color: c.textSecondary,
      fontWeight: Typography.weights.medium,
    },
    filterChipTextActive: {
      color: c.accent,
      fontWeight: Typography.weights.bold,
    },
    list: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.xl,
    },
    separator: { height: Spacing.sm },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    empty: {
      alignItems: 'center',
      paddingTop: Spacing.xxl,
      gap: Spacing.md,
      paddingHorizontal: Spacing.xl,
    },
    emptyTitle: {
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.weights.semibold,
      color: c.textSecondary,
    },
    emptySubtitle: {
      fontSize: Typography.sizes.md,
      color: c.textMuted,
      textAlign: 'center',
      lineHeight: 22,
    },
  });
}
