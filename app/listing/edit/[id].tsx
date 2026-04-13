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
  Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useHeaderHeight } from '@react-navigation/elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { listingsService } from '@/services/listings.service';
import { useAuth } from '@/context/AuthContext';
import { CATEGORY_LIST } from '@/constants/categories';
import { FACTION_LIST } from '@/constants/factions';
import { Category, FactionSlug, Listing } from '@/types';
import { supabase } from '@/lib/supabase';

async function uploadImage(uri: string, userId: string): Promise<string | null> {
  try {
    const fileName = `${userId}/${Date.now()}.jpg`;
    const response = await fetch(uri);
    const blob = await response.blob();
    const { error } = await supabase.storage
      .from('listing-images')
      .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from('listing-images').getPublicUrl(fileName);
    return data.publicUrl;
  } catch {
    return null;
  }
}

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
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
        setExistingImageUrl(l.image_url ?? null);
      }
      setLoadingListing(false);
    });
  }, [id]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required.';
    if (!category) e.category = 'Select a category.';
    if (!faction) e.faction = 'Select a faction.';
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) e.quantity = 'Enter a valid quantity.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !user || !id) return;
    setLoading(true);

    let imageUrl = existingImageUrl;
    if (imageUri) imageUrl = await uploadImage(imageUri, user.id);

    const { error } = await listingsService.updateListing(id, {
      title: title.trim(),
      description: description.trim() || null,
      want_in_return: wantInReturn.trim() || null,
      quantity: parseInt(quantity, 10),
      category: category!,
      faction: faction!,
      image_url: imageUrl,
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

  const previewImage = imageUri ?? existingImageUrl;

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
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
            {previewImage ? (
              <>
                <Image source={{ uri: previewImage }} style={styles.imagePreview} />
                <View style={styles.imageOverlay}>
                  <Ionicons name="camera" size={22} color="#fff" />
                  <Text style={styles.imageOverlayText}>Change Photo</Text>
                </View>
              </>
            ) : (
              <>
                <Ionicons name="camera-outline" size={32} color={colors.textMuted} />
                <Text style={styles.imagePickerText}>Add Photo (optional)</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>CATEGORY</Text>
            <View style={styles.optionRow}>
              {CATEGORY_LIST.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.optionBtn, category === cat.id && styles.optionBtnActive]}
                  onPress={() => setCategory(cat.id)}
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
              <Input label="Title" value={title} onChangeText={setTitle} error={errors.title} maxLength={100} />
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
    </SafeAreaView>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },
    center: { flex: 1, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center' },
    scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.xl },
    imagePicker: {
      height: 160,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      borderStyle: 'dashed',
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      gap: Spacing.sm,
    },
    imagePreview: { position: 'absolute', width: '100%', height: '100%' },
    imageOverlay: {
      position: 'absolute',
      bottom: 0, left: 0, right: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      paddingVertical: Spacing.sm,
    },
    imageOverlayText: { color: '#fff', fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
    imagePickerText: { fontSize: Typography.sizes.sm, color: c.textMuted },
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
  });
}
