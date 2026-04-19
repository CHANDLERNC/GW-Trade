import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { FACTIONS, FACTION_LIST } from '@/constants/factions';
import { FactionSlug, LFGZone, LFGRegion, LFGPost } from '@/types';

const ZONES: { id: LFGZone; label: string; icon: string; subtitle?: string }[] = [
  { id: 'any', label: 'Any Zone', icon: 'map' },
  // Faction Starter Towns
  { id: 'pha_lang', label: 'Pha Lang', icon: 'home', subtitle: 'LRI' },
  { id: 'nam_thaven', label: 'Nam Thaven', icon: 'home', subtitle: 'MSS' },
  { id: 'kiu_vongsa', label: 'Kiu Vongsa', icon: 'home', subtitle: 'CSI' },
  // Major Shared POIs
  { id: 'ybl_1', label: 'YBL-1', icon: 'layers' },
  { id: 'ban_pa', label: 'Ban Pa', icon: 'people' },
  { id: 'fort_narith', label: 'Fort Narith', icon: 'shield' },
  { id: 'midnight_sapphire', label: 'Midnight Sapphire', icon: 'diamond' },
  { id: 'tiger_bay', label: 'Tiger Bay', icon: 'warning' },
  { id: 'hunters_paradise', label: "Hunter's Paradise", icon: 'compass' },
  { id: 'falng_airfield', label: 'F.A.L.N.G. Airfield', icon: 'airplane' },
];

const REGIONS: LFGRegion[] = ['NA East', 'NA West', 'EU', 'Asia', 'OCE', 'SA'];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (post: {
    faction: FactionSlug;
    zone: LFGZone;
    region: LFGRegion;
    slots_total: number;
    description?: string;
    mic_required: boolean;
  }) => Promise<void>;
  initialFaction?: FactionSlug;
  postDurationHours: number;
  activePostCount: number;
  postLimit: number;
}

export function CreateLFGSheet({ visible, onClose, onSubmit, initialFaction, postDurationHours, activePostCount, postLimit }: Props) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [faction, setFaction] = useState<FactionSlug>(initialFaction ?? 'lri');
  const [zone, setZone] = useState<LFGZone>('any');
  const [region, setRegion] = useState<LFGRegion>('NA East');
  const [slots, setSlots] = useState(4);
  const [description, setDescription] = useState('');
  const [micRequired, setMicRequired] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await onSubmit({ faction, zone, region, slots_total: slots, description, mic_required: micRequired });
      setZone('any');
      setRegion('NA East');
      setSlots(4);
      setDescription('');
      setMicRequired(false);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedFaction = FACTIONS[faction];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Title */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>Looking for Group</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            {/* Faction */}
            <Text style={styles.sectionLabel}>Faction</Text>
            <View style={styles.factionRow}>
              {FACTION_LIST.map((f) => {
                const active = faction === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    style={[
                      styles.factionCard,
                      active && { borderColor: f.color, backgroundColor: f.color + '18' },
                    ]}
                    onPress={() => setFaction(f.id)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.factionCardShort, active && { color: f.color }]}>
                      {f.shortName}
                    </Text>
                    <Text style={styles.factionCardName} numberOfLines={1}>
                      {f.name.split(' ').slice(0, 2).join(' ')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Zone */}
            <Text style={styles.sectionLabel}>Zone</Text>
            <View style={styles.chipRow}>
              {ZONES.map((z) => {
                const active = zone === z.id;
                return (
                  <TouchableOpacity
                    key={z.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setZone(z.id)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={z.icon as any}
                      size={12}
                      color={active ? colors.accent : colors.textMuted}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {z.label}
                    </Text>
                    {z.subtitle && (
                      <Text style={[styles.chipSubtitle, active && { color: colors.accent + 'AA' }]}>
                        {' '}{z.subtitle}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Region */}
            <Text style={styles.sectionLabel}>Region</Text>
            <View style={styles.chipRow}>
              {REGIONS.map((r) => {
                const active = region === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setRegion(r)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{r}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Slots */}
            <Text style={styles.sectionLabel}>Squad Size</Text>
            <View style={styles.slotRow}>
              {[2, 3, 4].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[
                    styles.slotBtn,
                    slots === n && {
                      borderColor: selectedFaction.color,
                      backgroundColor: selectedFaction.color + '18',
                    },
                  ]}
                  onPress={() => setSlots(n)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.slotNum, slots === n && { color: selectedFaction.color }]}>
                    {n}
                  </Text>
                  <View style={styles.slotDots}>
                    {Array.from({ length: n }).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          i === 0
                            ? { backgroundColor: selectedFaction.color }
                            : slots === n
                            ? { backgroundColor: selectedFaction.color + '55' }
                            : { backgroundColor: colors.surfaceBorder },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={styles.slotOpenText}>{n - 1} open</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Mic required */}
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleLabel}>Mic Required</Text>
                <Text style={styles.toggleSub}>Voice comms required to join</Text>
              </View>
              <Switch
                value={micRequired}
                onValueChange={setMicRequired}
                trackColor={{ false: colors.surfaceBorder, true: colors.accent + '88' }}
                thumbColor={micRequired ? colors.accent : colors.textMuted}
              />
            </View>

            {/* Description */}
            <Text style={styles.sectionLabel}>Message (Optional)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="What are you planning to do? Any requirements..."
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={200}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{description.length}/200</Text>

            {/* Duration / limit notice */}
            <View style={styles.durationRow}>
              <Ionicons name="time-outline" size={13} color={colors.textMuted} />
              <Text style={styles.durationText}>
                Post stays live for{' '}
                <Text style={{ color: colors.accent, fontWeight: Typography.weights.bold }}>
                  {postDurationHours}h
                </Text>
                {'  ·  '}
                <Text style={{ color: colors.textMuted }}>
                  {activePostCount}/{postLimit} slots used
                </Text>
              </Text>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                { backgroundColor: selectedFaction.color },
                submitting && { opacity: 0.6 },
              ]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="people" size={16} color="#fff" />
                  <Text style={styles.submitBtnText}>Post LFG</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    sheet: {
      backgroundColor: c.background,
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      borderTopWidth: 1,
      borderColor: c.surfaceBorder,
      maxHeight: '92%',
    },
    handle: {
      width: 36,
      height: 4,
      backgroundColor: c.surfaceBorder,
      borderRadius: BorderRadius.full,
      alignSelf: 'center',
      marginTop: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.surfaceBorder,
    },
    title: {
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.weights.bold,
      color: c.text,
    },
    content: {
      padding: Spacing.lg,
      gap: Spacing.sm,
      paddingBottom: Spacing.xxl,
    },
    sectionLabel: {
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.weights.bold,
      color: c.textMuted,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginTop: Spacing.xs,
    },
    factionRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    factionCard: {
      flex: 1,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.sm,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      backgroundColor: c.surface,
      alignItems: 'center',
      gap: 2,
    },
    factionCardShort: {
      fontSize: Typography.sizes.md,
      fontWeight: Typography.weights.bold,
      color: c.textMuted,
    },
    factionCardName: {
      fontSize: 10,
      color: c.textMuted,
      textAlign: 'center',
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: 7,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      backgroundColor: c.surface,
    },
    chipActive: {
      borderColor: c.accent,
      backgroundColor: c.accent + '15',
    },
    chipText: {
      fontSize: Typography.sizes.sm,
      color: c.textSecondary,
      fontWeight: Typography.weights.medium,
    },
    chipTextActive: {
      color: c.accent,
      fontWeight: Typography.weights.bold,
    },
    chipSubtitle: {
      fontSize: 9,
      color: c.textMuted,
      fontWeight: Typography.weights.medium,
    },
    slotRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    slotBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      backgroundColor: c.surface,
      gap: 6,
    },
    slotNum: {
      fontSize: Typography.sizes.xl,
      fontWeight: Typography.weights.heavy,
      color: c.textSecondary,
    },
    slotDots: {
      flexDirection: 'row',
      gap: 4,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    slotOpenText: {
      fontSize: Typography.sizes.xs,
      color: c.textMuted,
    },
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      marginTop: Spacing.xs,
    },
    toggleLabel: {
      fontSize: Typography.sizes.md,
      fontWeight: Typography.weights.semibold,
      color: c.text,
    },
    toggleSub: {
      fontSize: Typography.sizes.xs,
      color: c.textMuted,
      marginTop: 2,
    },
    textArea: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: Spacing.md,
      fontSize: Typography.sizes.md,
      color: c.text,
      minHeight: 80,
    },
    charCount: {
      fontSize: Typography.sizes.xs,
      color: c.textMuted,
      textAlign: 'right',
      marginTop: 4,
    },
    submitBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      marginTop: Spacing.md,
    },
    submitBtnText: {
      fontSize: Typography.sizes.md,
      fontWeight: Typography.weights.bold,
      color: '#fff',
    },
    durationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: Spacing.xs,
    },
    durationText: {
      fontSize: Typography.sizes.xs,
      color: c.textMuted,
    },
  });
}
