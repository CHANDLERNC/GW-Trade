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

type PlayerRow = {
  id: string;
  username: string;
  display_name: string | null;
  strikes: number;
  trades_completed: number;
  ratings_positive: number;
  ratings_negative: number;
  is_admin: boolean;
  faction_preference: string | null;
};

export default function AdminPlayersScreen() {
  const { colors } = useTheme();
  const { profile: me } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState<string | null>(null);

  const load = useCallback(async (q?: string) => {
    const { data } = await adminService.searchPlayers(q ?? search);
    setPlayers((data as PlayerRow[]) ?? []);
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

  const handleExpand = (p: PlayerRow) => {
    if (expanded === p.id) {
      setExpanded(null);
    } else {
      setExpanded(p.id);
      setEditName(p.display_name ?? '');
      setEditUsername(p.username);
    }
  };

  const handleSave = async (p: PlayerRow) => {
    const trimmedName = editName.trim() || null;
    const trimmedUsername = editUsername.trim();
    if (!trimmedUsername) {
      Alert.alert('Error', 'Username cannot be empty.');
      return;
    }
    setSaving(p.id);
    const { error } = await adminService.updatePlayer(p.id, {
      display_name: trimmedName,
      username: trimmedUsername,
    });
    setSaving(null);
    if (error) {
      Alert.alert('Error', error.message ?? 'Could not save changes.');
    } else {
      setPlayers(prev =>
        prev.map(pl =>
          pl.id === p.id
            ? { ...pl, display_name: trimmedName, username: trimmedUsername }
            : pl
        )
      );
      setExpanded(null);
    }
  };

  const handleAdjustStrikes = async (p: PlayerRow, delta: 1 | -1) => {
    setAdjusting(p.id);
    const { data, error } = await adminService.adjustStrikes(p.id, delta);
    setAdjusting(null);
    if (error) {
      Alert.alert('Error', 'Could not update strikes.');
    } else {
      const row = data as { id: string; strikes: number } | null;
      if (row) {
        setPlayers(prev =>
          prev.map(pl => (pl.id === p.id ? { ...pl, strikes: row.strikes } : pl))
        );
      }
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Players</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={15} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={handleSearch}
          placeholder="Search username or display name..."
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
          data={players}
          keyExtractor={p => p.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="people-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>No players found</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isExpanded = expanded === item.id;
            const isSaving = saving === item.id;
            const isAdjusting = adjusting === item.id;

            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => handleExpand(item)}
                activeOpacity={0.85}
              >
                {/* Top row */}
                <View style={styles.cardTop}>
                  <View style={styles.nameBlock}>
                    <Text style={styles.username}>@{item.username}</Text>
                    {item.display_name ? (
                      <Text style={styles.displayName}>{item.display_name}</Text>
                    ) : null}
                  </View>
                  <View style={styles.statsRow}>
                    {item.is_admin && (
                      <View style={styles.adminPill}>
                        <Text style={styles.adminPillText}>ADMIN</Text>
                      </View>
                    )}
                    {item.strikes > 0 && (
                      <View style={styles.strikesPill}>
                        <Ionicons name="warning-outline" size={11} color={colors.danger} />
                        <Text style={styles.strikesPillText}>{item.strikes}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Stats */}
                <View style={styles.metaRow}>
                  <Ionicons name="swap-horizontal" size={11} color={colors.textMuted} />
                  <Text style={styles.metaText}>{item.trades_completed} trades</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Ionicons name="thumbs-up-outline" size={11} color={colors.textMuted} />
                  <Text style={styles.metaText}>{item.ratings_positive}</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Ionicons name="thumbs-down-outline" size={11} color={colors.textMuted} />
                  <Text style={styles.metaText}>{item.ratings_negative}</Text>
                </View>

                {/* Expanded editor */}
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    <Text style={styles.editLabel}>DISPLAY NAME</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editName}
                      onChangeText={setEditName}
                      placeholder="Display name (optional)"
                      placeholderTextColor={colors.textMuted}
                      autoCorrect={false}
                    />

                    <Text style={[styles.editLabel, { marginTop: Spacing.sm }]}>USERNAME</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editUsername}
                      onChangeText={setEditUsername}
                      placeholder="Username"
                      placeholderTextColor={colors.textMuted}
                      autoCorrect={false}
                      autoCapitalize="none"
                    />

                    {/* Strikes row */}
                    <Text style={[styles.editLabel, { marginTop: Spacing.sm }]}>STRIKES</Text>
                    <View style={styles.strikesRow}>
                      <TouchableOpacity
                        style={styles.strikeBtn}
                        onPress={() => handleAdjustStrikes(item, -1)}
                        disabled={isAdjusting || item.strikes <= 0}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="remove" size={18} color={colors.danger} />
                      </TouchableOpacity>
                      {isAdjusting ? (
                        <ActivityIndicator size="small" color={colors.accent} />
                      ) : (
                        <Text style={styles.strikesValue}>{item.strikes}</Text>
                      )}
                      <TouchableOpacity
                        style={styles.strikeBtn}
                        onPress={() => handleAdjustStrikes(item, 1)}
                        disabled={isAdjusting}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="add" size={18} color={colors.accent} />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={[styles.saveBtn, isSaving && styles.btnDisabled]}
                      onPress={() => handleSave(item)}
                      disabled={isSaving}
                      activeOpacity={0.8}
                    >
                      {isSaving ? (
                        <ActivityIndicator size="small" color={colors.background} />
                      ) : (
                        <Text style={styles.saveBtnText}>Save Changes</Text>
                      )}
                    </TouchableOpacity>
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
    headerTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: c.text },

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
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    nameBlock: { flex: 1, gap: 2 },
    username: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: c.text },
    displayName: { fontSize: Typography.sizes.xs, color: c.textSecondary },
    statsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },

    adminPill: {
      backgroundColor: c.accent + '20',
      borderWidth: 1,
      borderColor: c.accent + '55',
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
    },
    adminPillText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: c.accent },

    strikesPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: c.danger + '15',
      borderWidth: 1,
      borderColor: c.danger + '55',
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
    },
    strikesPillText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: c.danger },

    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: Typography.sizes.xs, color: c.textMuted },
    metaDot: { fontSize: Typography.sizes.xs, color: c.textMuted },

    expandedContent: {
      gap: Spacing.xs,
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

    strikesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xl,
      paddingVertical: Spacing.xs,
    },
    strikeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.surfaceElevated,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    strikesValue: {
      fontSize: Typography.sizes.xl,
      fontWeight: Typography.weights.bold,
      color: c.text,
      minWidth: 32,
      textAlign: 'center',
    },

    saveBtn: {
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      backgroundColor: c.accent,
      marginTop: Spacing.xs,
    },
    saveBtnText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: c.background },
    btnDisabled: { opacity: 0.5 },
  });
}
