import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useHeaderHeight } from '@react-navigation/elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { KeySelector } from '@/components/ui/KeySelector';
import { listingsService } from '@/services/listings.service';
import { useAuth } from '@/context/AuthContext';
import { CATEGORY_LIST } from '@/constants/categories';
import { FACTION_LIST } from '@/constants/factions';
import { Category, FactionSlug, Listing } from '@/types';
import { GZWKey, findKeyByName } from '@/constants/gzwKeys';

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const headerHeight = useHeaderHeight();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [listing, setListing] = useState<Listing | null>(null);
  const [loadingListing, setLoadingListing] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [wantInReturn, setWantInReturn] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [category, setCategory] = useState<Category | null>(null);
  const [faction, setFaction] = useState<FactionSlug | null>(null);
  const [selectedKey, setSelectedKey] = useState<GZWKey | null>(null);
  const [keySelectorVisible, setKeySelectorVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isKeyCategory = category === 'keys';

  useEffect(() => {
    if (!id) return;
    listingsService.getListing(id).then(({ data }) => {
      if (data) {
        const l = data as Listing;
        setListing(l);
        setTitle(l.title);
        setDescription(l.description ?? '');
        setWantInReturn(l.want_in_return ?? '');
        setQuantity(String(l.quantity));
        setCategory(l.category);
        setFaction(l.faction);
        if (l.category === 'keys' && l.key_name) {
          setSelectedKey(findKeyByName(l.key_name) ?? null);
        }
      }
      setLoadingListing(false);
    });
  }, [id]);

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat);
    if (cat !== 'keys') {
      setSelectedKey(null);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!category) e.category = 'Select a category.';
    if (!faction) e.faction = 'Select a faction.';
    if (isKeyCategory) {
      if (!selectedKey) e.key = 'Select a key from the list.';
    } else {
      if (!title.trim()) e.title = 'Title is required.';
    }
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) e.quantity = 'Enter a valid quantity.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !user || !id) return;
    setLoading(true);

    const listingTitle = isKeyCategory ? selectedKey!.name : title.trim();
    const keyName = isKeyCategory ? selectedKey!.name : null;

    const { error } = await listingsService.updateListing(id, {
      title: listingTitle,
      key_name: keyName,
      description: description.trim() || null,
      want_in_return: wantInReturn.trim() || null,
      quantity: parseInt(quantity, 10),
      category: category!,
      faction: faction!,
    });

    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      router.replace(`/listing/${id}`);
    }
  };

  if (loadingListing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={headerHeight}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>CATEGORY</Text>
            <View style={styles.optionRow}>
              {CATEGORY_LIST.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.optionBtn, category === cat.id && styles.optionBtnActive]}
                  onPress={() => handleCategoryChange(cat.id)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.optionText, category === cat.id && styles.optionTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.category && <Text style={styles.error}>{errors.category}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>FACTION</Text>
            <View style={styles.factionOptions}>
              {FACTION_LIST.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={[
                    styles.factionBtn,
                    { borderColor: f.color + '44' },
                    faction === f.id && { borderColor: f.color, backgroundColor: f.color + '18' },
                  ]}
                  onPress={() => setFaction(f.id)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.factionDot, { backgroundColor: f.color }]} />
                  <View>
                    <Text style={[styles.factionShort, faction === f.id && { color: f.color }]}>
                      {f.shortName}
                    </Text>
                    <Text style={styles.factionName}>{f.name}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            {errors.faction && <Text style={styles.error}>{errors.faction}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>DETAILS</Text>
            <View style={styles.inputs}>

              {/* Key picker (keys category only) */}
              {isKeyCategory ? (
                <View style={styles.keyPickerWrapper}>
                  <Text style={styles.inputLabel}>Key</Text>
                  <TouchableOpacity
                    style={[
                      styles.keyPickerBtn,
                      errors.key ? styles.keyPickerBtnError : undefined,
                      selectedKey ? styles.keyPickerBtnSelected : undefined,
                    ]}
                    onPress={() => setKeySelectorVisible(true)}
                    activeOpacity={0.75}
                  >
                    {selectedKey ? (
                      <>
                        <Text style={styles.keyPickerValue} numberOfLines={2}>
                          {selectedKey.name}
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={styles.keyPickerChevron} />
                      </>
                    ) : (
                      <>
                        <Text style={styles.keyPickerPlaceholder}>Select a key from the list...</Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={styles.keyPickerChevron} />
                      </>
                    )}
                  </TouchableOpacity>
                  {selectedKey && (
                    <Text style={styles.keyPickerHint}>{selectedKey.location}</Text>
                  )}
                  {errors.key && <Text style={styles.error}>{errors.key}</Text>}
                </View>
              ) : (
                <Input label="Title" value={title} onChangeText={setTitle} error={errors.title} maxLength={100} />
              )}

              <Input
                label="Description (optional)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                style={styles.multiline}
                maxLength={500}
              />
              <Input label="Want in Return" value={wantInReturn} onChangeText={setWantInReturn} maxLength={200} />
              <Input
                label="Quantity"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="number-pad"
                error={errors.quantity}
              />
            </View>
          </View>

          <Button title="Save Changes" onPress={handleSave} loading={loading} fullWidth size="lg" />
        </ScrollView>
      </KeyboardAvoidingView>

      <KeySelector
        visible={keySelectorVisible}
        selectedKeyName={selectedKey?.name ?? null}
        onSelect={(key) => { setSelectedKey(key); setErrors(e => ({ ...e, key: undefined as unknown as string })); }}
        onClose={() => setKeySelectorVisible(false)}
      />
    </SafeAreaView>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },
    center: { flex: 1, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center' },
    scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.xl },
    field: { gap: Spacing.sm },
    fieldLabel: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: c.textMuted, letterSpacing: 1.5 },
    optionRow: { flexDirection: 'row', gap: Spacing.sm },
    optionBtn: {
      flex: 1, paddingVertical: Spacing.sm + 2, borderRadius: BorderRadius.md,
      borderWidth: 1, borderColor: c.surfaceBorder, backgroundColor: c.surface, alignItems: 'center',
    },
    optionBtnActive: { borderColor: c.accent, backgroundColor: c.accent + '18' },
    optionText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: c.textSecondary },
    optionTextActive: { color: c.accent },
    factionOptions: { gap: Spacing.sm },
    factionBtn: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      backgroundColor: c.surface, borderRadius: BorderRadius.md, borderWidth: 1, padding: Spacing.md,
    },
    factionDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
    factionShort: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: c.text },
    factionName: { fontSize: Typography.sizes.sm, color: c.textSecondary, marginTop: 1 },
    inputs: { gap: Spacing.md },
    multiline: { height: 80, textAlignVertical: 'top', paddingTop: Spacing.sm },
    error: { fontSize: Typography.sizes.xs, color: c.danger },
    keyPickerWrapper: { gap: Spacing.xs },
    inputLabel: {
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.weights.medium,
      color: c.textSecondary,
      marginBottom: 2,
    },
    keyPickerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      minHeight: 48,
    },
    keyPickerBtnError: { borderColor: c.danger },
    keyPickerBtnSelected: { borderColor: c.accent + '88' },
    keyPickerPlaceholder: { flex: 1, fontSize: Typography.sizes.md, color: c.textMuted },
    keyPickerValue: { flex: 1, fontSize: Typography.sizes.md, color: c.text, lineHeight: 20 },
    keyPickerChevron: { marginLeft: Spacing.sm, flexShrink: 0 },
    keyPickerHint: { fontSize: Typography.sizes.xs, color: c.textMuted, marginTop: 2 },
  });
}
