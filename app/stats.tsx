// Personal Stats Screen (F-36)
// Read-only stats computed from local store data.

import React, { useEffect } from 'react';
import {
  AppState,
  AppStateStatus,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { Box } from '../src/types/box';
import { BoxIcon } from '../src/components/BoxIcon';
import { getBoxTypeConfig } from '../src/constants/boxTypes';
import { Colors } from '../src/constants/colors';
import { Spacing, Radius } from '../src/constants/spacing';
import { FontSize, FontWeight, LetterSpacing } from '../src/constants/typography';
import { BlurIntensity, GlassShadow, ThemeColors } from '../src/constants/theme';
import { useBoxStore } from '../src/store/boxStore';
import { computeStats } from '../src/utils/stats';

const CARD_BLUR = BlurIntensity.card;

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getCountdownLabel(unlockDate: string): string {
  const diff = new Date(unlockDate).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days <= 0) return 'Sắp sẵn sàng mở';
  if (days === 1) return 'Còn 1 ngày';
  return `Còn ${days} ngày`;
}

function GlassFill() {
  return (
    <>
      <BlurView
        intensity={CARD_BLUR}
        tint="dark"
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.glassTint} pointerEvents="none" />
    </>
  );
}

function Header({ topInset, onBack }: { topInset: number; onBack: () => void }) {
  return (
    <View style={[styles.header, { paddingTop: topInset + Spacing[2] }]}>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={onBack}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Quay lại"
      >
        <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
      <View style={styles.headerTitleWrap}>
        <Text style={styles.headerTitle}>Thống kê</Text>
        <Text style={styles.headerSubtitle}>Hành trình của bạn</Text>
      </View>
      <View style={styles.headerButton} />
    </View>
  );
}

function StatTile({
  label,
  value,
  icon,
  tone = ThemeColors.accent,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: string;
}) {
  return (
    <View style={styles.statTile}>
      <GlassFill />
      <View style={[styles.statIcon, { backgroundColor: `${tone}24` }]}>
        <Ionicons name={icon} size={18} color={tone} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={2}>{label}</Text>
    </View>
  );
}

function GoalCard({ completed, total }: { completed: number; total: number }) {
  const progress = total > 0 ? completed / total : 0;

  return (
    <View style={styles.card}>
      <GlassFill />
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Ionicons name="flag" size={18} color={ThemeColors.accent} />
        </View>
        <Text style={styles.sectionTitle}>Mục tiêu/thử thách hoàn thành</Text>
      </View>

      {total > 0 ? (
        <>
          <Text style={styles.bigRatio}>{completed}/{total}</Text>
          <Text style={styles.cardDescription}>mục tiêu/thử thách đã được đánh dấu hoàn thành</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
        </>
      ) : (
        <Text style={styles.emptyLine}>Chưa có mục tiêu/thử thách nào để đối chiếu.</Text>
      )}
    </View>
  );
}

function NextBoxCard({ box, onPress }: { box: Box; onPress: () => void }) {
  const config = getBoxTypeConfig(box.boxType);

  return (
    <Pressable style={styles.nextCard} onPress={onPress}>
      <GlassFill />
      <View style={styles.nextRow}>
        <BoxIcon boxType={box.boxType} size={44} showLockOverlay />
        <View style={styles.nextContent}>
          <Text style={styles.sectionLabel}>HỘP SẮP MỞ GẦN NHẤT</Text>
          <Text style={styles.nextTitle} numberOfLines={1}>{box.title || config.label}</Text>
          <View style={styles.nextMetaRow}>
            <Text style={styles.nextMeta}>{config.shortLabel}</Text>
            <View style={styles.metaDot} />
            <Text style={styles.nextMeta}>{getCountdownLabel(box.unlockDate)}</Text>
          </View>
          <Text style={styles.nextDate}>Mở vào {formatDate(box.unlockDate)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={ThemeColors.textMuted} />
      </View>
    </Pressable>
  );
}

function ReflectionCard({ count }: { count: number }) {
  return (
    <View style={styles.card}>
      <GlassFill />
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Ionicons name="create-outline" size={18} color={ThemeColors.accent} />
        </View>
        <Text style={styles.sectionTitle}>Reflection đã viết</Text>
      </View>
      <Text style={styles.bigRatio}>{count}</Text>
      <Text style={styles.cardDescription}>cảm nhận đã được lưu sau khi mở hộp</Text>
    </View>
  );
}

function EmptyState({ onCreatePress }: { onCreatePress: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="stats-chart" size={56} color={ThemeColors.accent} />
      </View>
      <Text style={styles.emptyTitle}>Chưa có dữ liệu thống kê</Text>
      <Text style={styles.emptyDescription}>
        Tạo hộp đầu tiên để bắt đầu ghi lại hành trình gửi lời nhắn cho chính mình trong tương lai.
      </Text>
      <Pressable onPress={onCreatePress} style={styles.ctaButton}>
        <LinearGradient
          colors={ThemeColors.accentGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaGradient}
        >
          <Ionicons name="add" size={20} color={ThemeColors.textOnAccent} />
          <Text style={styles.ctaText}>Tạo hộp đầu tiên</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

export default function StatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useBoxStore();
  const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0);
  const stats = computeStats(state.boxes);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        forceUpdate();
      }
    });
    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['rgba(242,107,31,0.14)', 'rgba(242,107,31,0.03)', 'rgba(14,14,16,0)']}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 0.55 }}
        style={styles.ambient}
        pointerEvents="none"
      />

      <Header topInset={insets.top} onBack={() => router.back()} />

      {stats.total === 0 ? (
        <EmptyState onCreatePress={() => router.push('/create-box')} />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing[8] },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            <StatTile label="Tổng" value={stats.total} icon="cube-outline" />
            <StatTile label="Đang khóa" value={stats.lockedCount} icon="lock-closed-outline" tone={ThemeColors.textMuted} />
            <StatTile label="Sẵn sàng mở" value={stats.readyCount} icon="sparkles-outline" />
            <StatTile label="Đã mở" value={stats.openedCount} icon="checkmark-circle-outline" tone={Colors.success} />
          </View>

          <GoalCard completed={stats.goalCompleted} total={stats.goalTotal} />

          {stats.nextBox && (
            <NextBoxCard
              box={stats.nextBox}
              onPress={() => router.push(`/box/${stats.nextBox?.id}/locked`)}
            />
          )}

          <ReflectionCard count={stats.reflectionNoteCount} />
        </ScrollView>
      )}
    </View>
  );
}

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[3],
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: LetterSpacing.tight,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    gap: Spacing[4],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
  },
  statTile: {
    width: '47.8%',
    minHeight: 136,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: ThemeColors.borderGlass,
    overflow: 'hidden',
    padding: Spacing[4],
    justifyContent: 'space-between',
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 34,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing[3],
  },
  statLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: ThemeColors.borderGlass,
    overflow: 'hidden',
    padding: Spacing[4],
  },
  nextCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: ThemeColors.borderGlass,
    overflow: 'hidden',
  },
  glassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: ThemeColors.surfaceGlass,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: ThemeColors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    letterSpacing: LetterSpacing.wider,
  },
  bigRatio: {
    fontSize: 36,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  cardDescription: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing[1],
  },
  emptyLine: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    lineHeight: FontSize.lg * 1.5,
  },
  progressTrack: {
    height: 8,
    backgroundColor: ThemeColors.trackOff,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginTop: Spacing[4],
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
    backgroundColor: ThemeColors.accent,
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
    gap: Spacing[3],
    minHeight: 112,
  },
  nextContent: {
    flex: 1,
    gap: 4,
  },
  nextTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  nextMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  nextMeta: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: ThemeColors.accent,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
  },
  nextDate: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[8],
    paddingBottom: Spacing[10],
    gap: Spacing[4],
  },
  emptyIconWrap: {
    width: 116,
    height: 116,
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
  ctaButton: {
    minHeight: 52,
    borderRadius: Radius.full,
    overflow: 'hidden',
    ...GlassShadow.cta,
  },
  ctaGradient: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[6],
  },
  ctaText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semiBold,
    color: ThemeColors.textOnAccent,
  },
});
