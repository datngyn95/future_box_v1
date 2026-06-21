// Home / Box List Screen — FutureBoxes
// Hiển thị tất cả hộp thời gian phân theo 3 nhóm:
// Sẵn sàng mở → Đang khóa → Đã mở
// UI: Dark Glassmorphism (design/uiuxguides.md)

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Dimensions,
  AppState,
  AppStateStatus,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  useAnimatedScrollHandler,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';

import { Colors } from '../../src/constants/colors';
import { ThemeColors, BlurIntensity, GlassShadow } from '../../src/constants/theme';
import { Spacing, Shadow, Radius } from '../../src/constants/spacing';
import { FontSize, FontWeight, LetterSpacing } from '../../src/constants/typography';
import { Box } from '../../src/types/box';
import { getBoxTypeConfig } from '../../src/constants/boxTypes';
import { BoxIcon } from '../../src/components/BoxIcon';
import { useBoxStore, getBoxStatus } from '../../src/store/boxStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FAB_SIZE = 56;
const FAB_BOTTOM_OFFSET = 24;
const CARD_BLUR = BlurIntensity.card;

// ─── Helper Functions ─────────────────────────────────────────────────────────

function getDaysRemaining(unlockDate: string): number {
  const now = new Date();
  const unlock = new Date(unlockDate);
  const diff = unlock.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getProgressPercent(createdAt: string, unlockDate: string): number {
  const created = new Date(createdAt).getTime();
  const unlock = new Date(unlockDate).getTime();
  const now = Date.now();
  if (unlock <= created) return 0;
  const percent = (now - created) / (unlock - created);
  return Math.min(1, Math.max(0, percent));
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function hasUnlockedTeaser(box: Box): boolean {
  const now = Date.now();
  return (box.teasers ?? []).some((teaser) =>
    new Date(teaser.unlockAt).getTime() <= now,
  );
}

// ─── Glass surface ────────────────────────────────────────────────────────────
// Lớp kính dùng chung: BlurView + tint trắng mờ + viền sáng. Đặt làm nền tuyệt đối,
// nội dung render đè lên trên. Container cha cần overflow:'hidden' + borderRadius.

function GlassFill({ intensity = CARD_BLUR }: { intensity?: number }) {
  return (
    <>
      <BlurView
        intensity={intensity}
        tint="dark"
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.glassTint} pointerEvents="none" />
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Card "Sẵn sàng mở" với pulse animation
function ReadyToOpenCard({ box, onPress }: { box: Box; onPress: () => void }) {
  const config = getBoxTypeConfig(box.boxType);
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, []);

  const dotPulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: interpolate(pulseOpacity.value, [0.4, 1], [1, 1.35]) }],
  }));

  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <Animated.View style={[pressStyle, styles.readyShadow]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.glassCard, styles.readyCard]}
      >
        <GlassFill />
        <View style={styles.cardRow}>
          <View style={styles.cardLeft}>
            <BoxIcon boxType={box.boxType} size={44} showLockOverlay={false} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {box.title || config.label}
            </Text>
            <View style={styles.readyToOpenRow}>
              <Animated.View style={[styles.readyDot, dotPulseStyle]} />
              <Text style={styles.readyToOpenText}>Sẵn sàng để mở!</Text>
            </View>
            <Text style={styles.cardDateText}>Tạo ngày {formatDate(box.createdAt)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={ThemeColors.accent} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Progress bar với animate fill khi mount
function AnimatedProgressBar({ progress }: { progress: number }) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(progress, { duration: 400, easing: Easing.out(Easing.quad) });
  }, [progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%` as unknown as number,
  }));

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, barStyle]} />
    </View>
  );
}

// Card "Đang khóa"
function LockedCard({ box, onPress }: { box: Box; onPress: () => void }) {
  const config = getBoxTypeConfig(box.boxType);
  const daysRemaining = getDaysRemaining(box.unlockDate);
  const progress = getProgressPercent(box.createdAt, box.unlockDate);
  const showTeaserBadge = hasUnlockedTeaser(box);

  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <Animated.View style={pressStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.glassCard, styles.lockedCard]}
      >
        <GlassFill />
        <View style={styles.cardRow}>
          <View style={styles.cardLeft}>
            <BoxIcon boxType={box.boxType} size={44} showLockOverlay={true} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {box.title || config.label}
            </Text>
            <View style={styles.countdownRow}>
              <Text style={styles.countdownNumber}>{daysRemaining}</Text>
              <Text style={styles.countdownLabel}> ngày nữa</Text>
            </View>
            <AnimatedProgressBar progress={progress} />
            <Text style={styles.unlockDateText}>Mở vào {formatDate(box.unlockDate)}</Text>
            {showTeaserBadge && (
              <View style={styles.teaserBadge}>
                <Ionicons name="sparkles-outline" size={12} color={ThemeColors.accent} />
                <Text style={styles.teaserBadgeText}>Có gợi ý mới</Text>
              </View>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={ThemeColors.textMuted} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Card "Đã mở"
function OpenedCard({ box, onPress }: { box: Box; onPress: () => void }) {
  const config = getBoxTypeConfig(box.boxType);

  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const isYes = box.reflectionAnswer === 'yes';

  return (
    <Animated.View style={pressStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.glassCard, styles.openedCard]}
      >
        <GlassFill intensity={BlurIntensity.card - 8} />
        <View style={styles.cardRow}>
          <View style={styles.cardLeft}>
            <BoxIcon boxType={box.boxType} size={40} showLockOverlay={false} />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, styles.openedCardTitle]} numberOfLines={1}>
              {box.title || config.label}
            </Text>
            <Text style={styles.openedDateText}>
              Đã mở ngày {formatDate(box.openedAt || box.unlockDate)}
            </Text>
          </View>
          {box.reflectionAnswer !== null && box.reflectionAnswer !== undefined && (
            <View style={[
              styles.reflectionBadge,
              { backgroundColor: isYes ? Colors.successLight : ThemeColors.surfaceGlassStrong },
            ]}>
              <Ionicons
                name={isYes ? 'checkmark' : 'close'}
                size={12}
                color={isYes ? Colors.success : Colors.textMuted}
              />
              <Text style={[
                styles.reflectionBadgeText,
                { color: isYes ? Colors.success : Colors.textMuted },
              ]}>
                {isYes ? 'Có' : 'Không'}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Section Header
function SectionHeader({
  title,
  count,
  badgeColor,
  showBadge = true,
}: {
  title: string;
  count: number;
  badgeColor?: string;
  showBadge?: boolean;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {showBadge && (
        <View style={[styles.sectionBadge, { backgroundColor: badgeColor || Colors.textMuted }]}>
          <Text style={styles.sectionBadgeText}>{count}</Text>
        </View>
      )}
    </View>
  );
}

// Gradient pill CTA dùng chung
function PillButton({
  label,
  iconName,
  onPress,
}: {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[pressStyle, GlassShadow.cta]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 400 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12, stiffness: 300 }); }}
      >
        <LinearGradient
          colors={ThemeColors.accentGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.pill}
        >
          <Ionicons name={iconName} size={20} color={ThemeColors.textOnAccent} />
          <Text style={styles.pillText}>{label}</Text>
          <Ionicons name="chevron-forward" size={18} color={ThemeColors.textOnAccent} style={styles.pillChevron} />
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// Empty State
function EmptyState({ onCreatePress }: { onCreatePress: () => void }) {
  const floatY = useSharedValue(0);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <View style={styles.emptyContainer}>
      <Animated.View style={[styles.emptyIllustration, floatStyle]}>
        <View style={styles.emptyBoxOuter}>
          <Ionicons name="cube-outline" size={80} color={ThemeColors.accent} />
        </View>
      </Animated.View>
      <Text style={styles.emptyTitle}>Chưa có hộp nào</Text>
      <Text style={styles.emptyDescription}>
        Tạo hộp đầu tiên của bạn và gửi một thông điệp cho chính mình trong tương lai.
      </Text>
      <PillButton label="Tạo hộp đầu tiên" iconName="add" onPress={onCreatePress} />
    </View>
  );
}

type FilterType = 'all' | 'ready' | 'locked' | 'opened';

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'ready', label: 'Sẵn sàng mở' },
  { key: 'locked', label: 'Đang khóa' },
  { key: 'opened', label: 'Đã mở' },
];

// ─── Search Bar ───────────────────────────────────────────────────────────────

function SearchBar({
  value,
  onChangeText,
  onClose,
}: {
  value: string;
  onChangeText: (t: string) => void;
  onClose: () => void;
}) {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  return (
    <View style={searchStyles.container}>
      <Ionicons name="search" size={18} color={Colors.textMuted} style={searchStyles.icon} />
      <TextInput
        ref={inputRef}
        style={searchStyles.input}
        placeholder="Tìm hộp theo tiêu đề..."
        placeholderTextColor={Colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      <TouchableOpacity onPress={onClose} style={searchStyles.closeBtn} activeOpacity={0.7}>
        <Text style={searchStyles.closeTxt}>Hủy</Text>
      </TouchableOpacity>
    </View>
  );
}

const searchStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.inputBg,
    borderWidth: 1,
    borderColor: ThemeColors.borderGlass,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    marginHorizontal: Spacing[4],
    marginBottom: Spacing[2],
    gap: Spacing[2],
  },
  icon: { flexShrink: 0 },
  input: {
    flex: 1,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  closeBtn: { paddingHorizontal: Spacing[1] },
  closeTxt: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.medium },
});

// ─── Filter Chips ─────────────────────────────────────────────────────────────

function FilterChips({
  active,
  onChange,
}: {
  active: FilterType;
  onChange: (f: FilterType) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={chipStyles.row}
      style={chipStyles.scroll}
    >
      {FILTER_OPTIONS.map((f) => (
        <TouchableOpacity
          key={f.key}
          onPress={() => onChange(f.key)}
          style={[chipStyles.chip, active === f.key && chipStyles.chipActive]}
          activeOpacity={0.75}
        >
          <Text style={[chipStyles.label, active === f.key && chipStyles.labelActive]}>
            {f.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const chipStyles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row: { paddingHorizontal: Spacing[4], paddingBottom: Spacing[2], gap: Spacing[2] },
  chip: {
    height: 36,
    paddingHorizontal: Spacing[4],
    borderRadius: Radius.full,
    backgroundColor: ThemeColors.surfaceGlass,
    borderWidth: 1,
    borderColor: ThemeColors.borderGlass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: ThemeColors.accentSoft,
    borderColor: ThemeColors.accent,
  },
  label: {
    fontSize: FontSize.sm,
    lineHeight: Math.round(FontSize.sm * 1.5),
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    includeFontPadding: false,
    textAlign: 'center',
  },
  labelActive: { color: ThemeColors.accent },
});

// ─── Main Home Screen ─────────────────────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state } = useBoxStore();
  const scrollRef = useRef<Animated.ScrollView>(null);

  // Search & filter state (F-17)
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showAllOpened, setShowAllOpened] = useState(false);

  // Tính trạng thái realtime cho mỗi hộp
  const allBoxes = state.boxes;

  // Apply filter + search
  const filteredBoxes = allBoxes.filter((b) => {
    const status = getBoxStatus(b);
    const matchFilter =
      activeFilter === 'all' ||
      (activeFilter === 'ready' && status === 'ready_to_open') ||
      (activeFilter === 'locked' && status === 'locked') ||
      (activeFilter === 'opened' && status === 'opened');
    const q = searchText.trim().toLowerCase();
    const matchSearch = !q || (b.title ?? '').toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const readyBoxes = filteredBoxes.filter((b) => getBoxStatus(b) === 'ready_to_open');
  const lockedBoxes = filteredBoxes.filter((b) => getBoxStatus(b) === 'locked');
  const openedBoxes = filteredBoxes.filter((b) => getBoxStatus(b) === 'opened');
  const isEmpty = allBoxes.length === 0;
  const noResults = !isEmpty && filteredBoxes.length === 0;

  // Khi app trở lại foreground: recompute status (hộp đến hạn tự chuyển ready_to_open)
  // State tự recompute vì getBoxStatus() là pure function chạy mỗi render.
  // AppState listener dùng để force re-render.
  const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        // Force re-render để recalculate getBoxStatus() với thời gian mới
        forceUpdate();

        // Nếu có hộp ready_to_open mới → scroll lên đầu (AC-05.4)
        const hasReady = allBoxes.some((b) => getBoxStatus(b) === 'ready_to_open');
        if (hasReady) {
          scrollRef.current?.scrollTo({ y: 0, animated: true });
        }
      }
    });
    return () => subscription.remove();
  }, [allBoxes]);

  // Header elevation when scrolled
  const scrollY = useSharedValue(0);

  // FAB hide/show on scroll direction
  const lastScrollY = useSharedValue(0);
  const fabTranslateY = useSharedValue(0);
  // Khoảng dịch đủ để FAB khuất hẳn dưới mép màn (gồm cả safe-area inset),
  // nếu không FAB chỉ trượt một phần và bị "che mất một nửa" ở mép dưới.
  const fabHiddenOffset = FAB_SIZE + FAB_BOTTOM_OFFSET + insets.bottom + 16;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const currentY = event.contentOffset.y;
      const diff = currentY - lastScrollY.value;

      if (diff > 8 && currentY > 60) {
        fabTranslateY.value = withTiming(fabHiddenOffset, {
          duration: 200,
          easing: Easing.out(Easing.quad),
        });
      } else if (diff < -8) {
        fabTranslateY.value = withTiming(0, {
          duration: 200,
          easing: Easing.out(Easing.quad),
        });
      }

      lastScrollY.value = currentY;
      scrollY.value = currentY;
    },
  });

  const fabScale = useSharedValue(1);
  const fabPressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }, { translateY: fabTranslateY.value }],
  }));

  useEffect(() => {
    fabScale.value = withSpring(1, { damping: 10, stiffness: 200 });
  }, []);

  const handleFABPressIn = useCallback(() => {
    fabScale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  }, []);
  const handleFABPressOut = useCallback(() => {
    fabScale.value = withSpring(1, { damping: 12, stiffness: 300 });
  }, []);
  const handleFABPress = useCallback(() => {
    router.push('/create-box');
  }, [router]);

  const handleBoxPress = useCallback((box: Box) => {
    const status = getBoxStatus(box);
    if (status === 'ready_to_open') {
      router.push(`/box/${box.id}/pre-open`);
    } else if (status === 'locked') {
      router.push(`/box/${box.id}/locked`);
    } else {
      router.push(`/box/${box.id}/detail`);
    }
  }, [router]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ── Ambient glow backdrop (chiều sâu cho glass) ── */}
      <LinearGradient
        colors={['rgba(242,107,31,0.14)', 'rgba(242,107,31,0.03)', 'rgba(14,14,16,0)']}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 0.55 }}
        style={styles.ambient}
        pointerEvents="none"
      />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing[2] }]}>
        <View style={styles.headerLeft}>
          <View style={styles.headerLogoCircle}>
            <Ionicons name="cube" size={18} color={ThemeColors.accent} />
          </View>
          <Text style={styles.headerTitle}>Hộp của bạn</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSearch(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/stats')}
            activeOpacity={0.7}
          >
            <Ionicons name="bar-chart-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/settings')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Search bar (F-17) ── */}
      {showSearch && (
        <SearchBar
          value={searchText}
          onChangeText={setSearchText}
          onClose={() => { setShowSearch(false); setSearchText(''); }}
        />
      )}

      {/* ── Filter chips (F-17) ── */}
      {!isEmpty && (
        <FilterChips active={activeFilter} onChange={setActiveFilter} />
      )}

      {/* ── Content ── */}
      {isEmpty ? (
        <EmptyState onCreatePress={handleFABPress} />
      ) : noResults ? (
        <View style={styles.noResultsContainer}>
          <Ionicons name="search" size={48} color={ThemeColors.textMuted} />
          <Text style={styles.noResultsText}>Không tìm thấy hộp nào</Text>
        </View>
      ) : (
        <Animated.ScrollView
          ref={scrollRef}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + FAB_SIZE + FAB_BOTTOM_OFFSET + Spacing[4] },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Section: Sẵn sàng mở */}
          {readyBoxes.length > 0 && (
            <View style={styles.section}>
              <SectionHeader
                title="SẴNG SÀNG MỞ"
                count={readyBoxes.length}
                badgeColor={Colors.badgeReady}
              />
              {readyBoxes.map((box) => (
                <ReadyToOpenCard
                  key={box.id}
                  box={box}
                  onPress={() => handleBoxPress(box)}
                />
              ))}
            </View>
          )}

          {/* Section: Đang khóa */}
          {lockedBoxes.length > 0 && (
            <View style={styles.section}>
              <SectionHeader
                title={`ĐANG KHÓA (${lockedBoxes.length})`}
                count={lockedBoxes.length}
                badgeColor={Colors.sectionLocked}
                showBadge={false}
              />
              {lockedBoxes.map((box) => (
                <LockedCard
                  key={box.id}
                  box={box}
                  onPress={() => handleBoxPress(box)}
                />
              ))}
            </View>
          )}

          {/* Section: Đã mở */}
          {openedBoxes.length > 0 && (
            <View style={styles.section}>
              <SectionHeader
                title="ĐÃ MỞ"
                count={openedBoxes.length}
                badgeColor={Colors.sectionOpened}
              />
              {(showAllOpened ? openedBoxes : openedBoxes.slice(0, 3)).map((box) => (
                <OpenedCard
                  key={box.id}
                  box={box}
                  onPress={() => handleBoxPress(box)}
                />
              ))}
              {openedBoxes.length > 3 && (
                <TouchableOpacity
                  style={styles.seeMoreButton}
                  activeOpacity={0.7}
                  onPress={() => setShowAllOpened((prev) => !prev)}
                >
                  <Text style={styles.seeMoreText}>
                    {showAllOpened ? 'Thu gọn' : `Xem thêm ${openedBoxes.length - 3} hộp`}
                  </Text>
                  <Ionicons
                    name={showAllOpened ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={ThemeColors.accent}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
        </Animated.ScrollView>
      )}

      {/* ── FAB ── */}
      <Animated.View
        style={[
          styles.fab,
          fabPressStyle,
          GlassShadow.cta,
          { bottom: insets.bottom + FAB_BOTTOM_OFFSET },
        ]}
      >
        <Pressable
          onPress={handleFABPress}
          onPressIn={handleFABPressIn}
          onPressOut={handleFABPressOut}
          style={styles.fabInner}
        >
          <LinearGradient
            colors={ThemeColors.accentGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color={ThemeColors.textOnAccent} />
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
  ambient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 360,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[3],
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  headerLogoCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: ThemeColors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: LetterSpacing.tight,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
  },

  // Sections
  section: {
    marginBottom: Spacing[5],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    letterSpacing: LetterSpacing.wider,
  },
  sectionBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[1],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: ThemeColors.textOnAccent,
  },

  // Glass card base
  glassCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: ThemeColors.borderGlass,
    overflow: 'hidden',
    marginBottom: Spacing[3],
  },
  glassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: ThemeColors.surfaceGlass,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
    gap: Spacing[3],
  },

  // Ready-to-open card
  readyShadow: {
    ...Shadow.md,
    shadowColor: ThemeColors.accent,
    shadowOpacity: 0.18,
    borderRadius: Radius.xl,
  },
  readyCard: {
    borderColor: 'rgba(242,107,31,0.45)',
    borderLeftWidth: 3,
    borderLeftColor: ThemeColors.accent,
  },
  readyToOpenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    marginTop: 2,
  },
  readyDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: ThemeColors.accent,
  },
  readyToOpenText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
    color: ThemeColors.accent,
  },

  // Common card parts
  cardLeft: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  cardDateText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Locked card
  lockedCard: {},
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  countdownNumber: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    color: ThemeColors.accent,
  },
  countdownLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  progressTrack: {
    height: 4,
    backgroundColor: ThemeColors.trackOff,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginTop: Spacing[2],
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
    backgroundColor: ThemeColors.accent,
  },
  unlockDateText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 3,
  },
  teaserBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: ThemeColors.accentSoft,
    marginTop: Spacing[2],
  },
  teaserBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semiBold,
    color: ThemeColors.accent,
  },

  // Opened card
  openedCard: {
    opacity: 0.9,
  },
  openedCardTitle: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
  },
  openedDateText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  reflectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  reflectionBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semiBold,
  },

  // See more button
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[1],
    paddingVertical: Spacing[3],
  },
  seeMoreText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: ThemeColors.accent,
  },

  // Gradient pill CTA
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    borderRadius: Radius.full,
  },
  pillText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semiBold,
    color: ThemeColors.textOnAccent,
    letterSpacing: 0.2,
  },
  pillChevron: {
    marginLeft: -2,
    opacity: 0.85,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: Spacing[4],
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
  },
  fabInner: {
    width: '100%',
    height: '100%',
    borderRadius: FAB_SIZE / 2,
    overflow: 'hidden',
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // No results
  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[3],
    paddingBottom: Spacing[16],
  },
  noResultsText: {
    fontSize: FontSize.xl,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[8],
    gap: Spacing[4],
  },
  emptyIllustration: {
    marginBottom: Spacing[2],
  },
  emptyBoxOuter: {
    width: 120,
    height: 120,
    borderRadius: Radius.xl,
    backgroundColor: ThemeColors.accentSoft,
    borderWidth: 1,
    borderColor: ThemeColors.borderGlass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.lg * 1.6,
  },
});
