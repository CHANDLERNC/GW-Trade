import React, { useState, useMemo, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { GZWKey, GZW_KEY_SECTIONS } from '@/constants/gzwKeys';

interface KeySelectorProps {
  visible: boolean;
  selectedKeyName: string | null;
  onSelect: (key: GZWKey) => void;
  onClose: () => void;
}

interface SectionData {
  title: string;
  data: GZWKey[];
}

export function KeySelector({ visible, selectedKeyName, onSelect, onClose }: KeySelectorProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');

  const sections: SectionData[] = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return GZW_KEY_SECTIONS.map(s => ({ title: s.location, data: s.keys }));
    }
    const filtered: SectionData[] = [];
    for (const section of GZW_KEY_SECTIONS) {
      const matched = section.keys.filter(k =>
        k.name.toLowerCase().includes(trimmed) ||
        k.location.toLowerCase().includes(trimmed)
      );
      if (matched.length > 0) {
        filtered.push({ title: section.location, data: matched });
      }
    }
    return filtered;
  }, [query]);

  const totalResults = useMemo(() => sections.reduce((n, s) => n + s.data.length, 0), [sections]);

  const handleSelect = useCallback((key: GZWKey) => {
    onSelect(key);
    setQuery('');
    onClose();
  }, [onSelect, onClose]);

  const handleClose = useCallback(() => {
    setQuery('');
    onClose();
  }, [onClose]);

  const renderSectionHeader = useCallback(({ section }: { section: SectionData }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title.toUpperCase()}</Text>
    </View>
  ), [styles]);

  const renderItem = useCallback(({ item }: { item: GZWKey }) => {
    const isSelected = item.name === selectedKeyName;
    return (
      <TouchableOpacity
        style={[styles.keyRow, isSelected && styles.keyRowSelected]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <Text style={[styles.keyName, isSelected && styles.keyNameSelected]} numberOfLines={2}>
          {item.name}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark" size={18} color={colors.accent} style={styles.checkIcon} />
        )}
      </TouchableOpacity>
    );
  }, [styles, colors, selectedKeyName, handleSelect]);

  const keyExtractor = useCallback((item: GZWKey) => item.id, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Select a Key</Text>
            <Text style={styles.headerSubtitle}>
              {totalResults} {totalResults === 1 ? 'key' : 'keys'}
              {query.trim() ? ' found' : ' available'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={16} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search keys or locations..."
            placeholderTextColor={colors.textMuted}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {query.length > 0 && Platform.OS === 'android' && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* List */}
        {sections.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="key-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No keys found</Text>
            <Text style={styles.emptySubtitle}>Try a different location or key name</Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={keyExtractor}
            renderSectionHeader={renderSectionHeader}
            renderItem={renderItem}
            stickySectionHeadersEnabled
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.listContent}
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            windowSize={10}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: c.surfaceBorder,
    },
    headerLeft: { flex: 1, gap: 2 },
    headerTitle: {
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.weights.bold,
      color: c.text,
    },
    headerSubtitle: {
      fontSize: Typography.sizes.xs,
      color: c.textMuted,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      marginHorizontal: Spacing.lg,
      marginVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      height: 44,
      gap: Spacing.sm,
    },
    searchIcon: { flexShrink: 0 },
    searchInput: {
      flex: 1,
      fontSize: Typography.sizes.md,
      color: c.text,
      padding: 0,
    },
    sectionHeader: {
      backgroundColor: c.background,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.xs,
    },
    sectionHeaderText: {
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.weights.bold,
      color: c.textMuted,
      letterSpacing: 1.2,
    },
    keyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.surfaceBorder,
    },
    keyRowSelected: {
      backgroundColor: c.accent + '12',
    },
    keyName: {
      flex: 1,
      fontSize: Typography.sizes.sm,
      color: c.text,
      lineHeight: 20,
    },
    keyNameSelected: {
      color: c.accent,
      fontWeight: Typography.weights.semibold,
    },
    checkIcon: { marginLeft: Spacing.sm, flexShrink: 0 },
    listContent: { paddingBottom: Spacing.xxl },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      paddingBottom: Spacing.xxl,
    },
    emptyTitle: {
      fontSize: Typography.sizes.md,
      fontWeight: Typography.weights.semibold,
      color: c.textSecondary,
    },
    emptySubtitle: {
      fontSize: Typography.sizes.sm,
      color: c.textMuted,
    },
  });
}
