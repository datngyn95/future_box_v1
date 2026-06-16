// Locked Box Peek Screen — xem metadata hộp đang khóa (F-03, F-15)
// Tuyệt đối không hiển thị nội dung — chỉ metadata (AC-03.1)

import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { Colors } from '../../../src/constants/colors';
import { Spacing, Radius } from '../../../src/constants/spacing';
import { FontSize, FontWeight } from '../../../src/constants/typography';
import { getBoxTypeConfig } from '../../../src/constants/boxTypes';
import { BoxIcon } from '../../../src/components/BoxIcon';
import { useBoxStore } from '../../../src/store/boxStore';
import { deleteBox } from '../../../src/db/boxRepository';

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
  return Math.min(1, Math.max(0, (now - created) / (unlock - created)));
}

function formatDateFull(dateString: string): string {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function LockedBoxPeekScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { state, dispatch } = useBoxStore();
  const insets = useSafeAreaInsets();

  const box = state.boxes.find((b) => b.id === id);
  const config = box ? getBoxTypeConfig(box.boxType) : null;

  const daysRemaining = box ? getDaysRemaining(box.unlockDate) : 0;
  const progress = box ? getProgressPercent(box.createdAt, box.unlockDate) : 0;

  const countdownScale = useSharedValue(0.5);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    countdownScale.value = withSpring(1, { damping: 12, stiffness: 200 });
    progressWidth.value = withTiming(progress, {
      duration: 700,
      easing: Easing.out(Easing.quad),
    });
  }, []);

  const countdownStyle = useAnimatedStyle(() => ({
    transform: [{ scale: countdownScale.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%` as unknown as number,
  }));

  const handleDelete = useCallback(() => {
    if (!box) return;
    Alert.alert(
      'Xóa hộp này?',
      'Hành động này không thể hoàn tác. Nội dung sẽ bị xóa vĩnh viễn.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBox(box.id);
              dispatch({ type: 'DELETE_BOX', payload: box.id });
              router.back();
            } catch {
              Alert.alert('Lỗi', 'Không thể xóa hộp. Vui lòng thử lại.');
            }
          },
        },
      ],
    );
  }, [box, dispatch, router]);

  if (!box || !config) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.errorText}>Không tìm thấy hộp</Text>
      </View>
    );
  }

  const displayTitle = box.title || config.label;

  return (
    <View style={[styles.root, { backgroundColor: Colors.background }]}>
      <LinearGradient
        colors={[config.bgColor, Colors.background]}
        style={[styles.hero, { paddingTop: insets.top }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {displayTitle}
          </Text>
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.headerBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={22} color={Colors.danger} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroContent}>
          <BoxIcon boxType={box.boxType} size={80} showLockOverlay />
          <View style={[styles.typeBadge, { backgroundColor: config.color }]}>
            <Text style={styles.typeBadgeText}>{config.label.toUpperCase()}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing[8] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.countdownContainer, countdownStyle]}>
          <Text style={[styles.countdownNumber, { color: config.color }]}>
            {daysRemaining}
          </Text>
          <Text style={styles.countdownLabel}>ngày nữa</Text>
        </Animated.View>

        <Text style={styles.unlockDateText}>
          Sẽ mở vào {formatDateFull(box.unlockDate)}
        </Text>

        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabelText}>
              {formatDateFull(box.createdAt)}
            </Text>
            <Text style={styles.progressLabelText}>
              {formatDateFull(box.unlockDate)}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                { backgroundColor: config.color },
                progressStyle,
              ]}
            />
          </View>
        </View>

        <View style={styles.hiddenNotice}>
          <Ionicons name="lock-closed" size={16} color={Colors.textMuted} />
          <Text style={styles.hiddenNoticeText}>
            Nội dung hộp đang được bảo vệ đến ngày mở.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.danger} />
          <Text style={styles.deleteButtonText}>Xóa hộp</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: FontSize.xl, color: Colors.textSecondary },

  hero: {
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[6],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing[3],
    marginBottom: Spacing[4],
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
    marginHorizontal: Spacing[2],
  },

  heroContent: {
    alignItems: 'center',
    gap: Spacing[3],
  },
  typeBadge: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: Radius.full,
  },
  typeBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textOnColor,
    letterSpacing: 1.2,
  },

  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[5],
    gap: Spacing[3],
  },

  countdownContainer: {
    alignItems: 'center',
  },
  countdownNumber: {
    fontSize: 72,
    fontWeight: FontWeight.bold,
    lineHeight: 80,
  },
  countdownLabel: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    marginTop: Spacing[1],
  },

  unlockDateText: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  progressSection: {
    width: '100%',
    marginTop: Spacing[2],
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing[2],
  },
  progressLabelText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.progressTrack,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
  },

  hiddenNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderRadius: Radius.md,
    width: '100%',
    marginTop: Spacing[2],
  },
  hiddenNoticeText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    flex: 1,
  },

  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    marginTop: Spacing[4],
  },
  deleteButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.medium,
    color: Colors.danger,
  },
});
