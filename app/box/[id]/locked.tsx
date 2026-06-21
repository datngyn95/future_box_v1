// Locked Box Peek Screen — xem metadata hộp đang khóa (F-03, F-15)
// Tuyệt đối không hiển thị nội dung — chỉ metadata (AC-03.1)

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
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
import { deleteBox, upsertPrediction } from '../../../src/db/boxRepository';

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
  const [predictionText, setPredictionText] = useState('');
  const [isSavingPrediction, setIsSavingPrediction] = useState(false);
  const [predictionSaved, setPredictionSaved] = useState(false);

  useEffect(() => {
    countdownScale.value = withSpring(1, { damping: 12, stiffness: 200 });
    progressWidth.value = withTiming(progress, {
      duration: 700,
      easing: Easing.out(Easing.quad),
    });
  }, []);

  // Chỉ khởi tạo lại text + cờ "Đã lưu" khi chuyển sang hộp khác.
  // Không phụ thuộc vào predictionText của store để tránh tự reset cờ
  // "Đã lưu" ngay sau khi dispatch cập nhật prediction (bug bấm lưu 2 lần).
  useEffect(() => {
    setPredictionText(box?.prediction?.predictionText ?? '');
    setPredictionSaved(false);
  }, [box?.id]);

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

  const handleSavePrediction = useCallback(async () => {
    if (!box || isSavingPrediction) return;
    setIsSavingPrediction(true);
    try {
      const prediction = await upsertPrediction(box.id, predictionText);
      dispatch({
        type: 'UPDATE_BOX',
        payload: { ...box, prediction: prediction ?? undefined },
      });
      setPredictionText(prediction?.predictionText ?? '');
      setPredictionSaved(true);
    } catch (error) {
      const message =
        error instanceof Error && error.message === 'BOX_NOT_EDITABLE'
          ? 'Dự đoán đã khóa sau khi hộp mở.'
          : 'Không lưu được dự đoán, thử lại.';
      Alert.alert('Lỗi', message);
    } finally {
      setIsSavingPrediction(false);
    }
  }, [box, dispatch, isSavingPrediction, predictionText]);

  if (!box || !config) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.errorText}>Không tìm thấy hộp</Text>
      </View>
    );
  }

  const displayTitle = box.title || config.label;
  const teaserNow = Date.now();
  const teasers = box.teasers ?? [];
  const unlockedTeasers = teasers.filter(
    (teaser) => new Date(teaser.unlockAt).getTime() <= teaserNow,
  );
  const waitingTeaserCount = teasers.length - unlockedTeasers.length;
  const isBoxStillLocked = !box.openedAt && teaserNow < new Date(box.unlockDate).getTime();

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: Colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing[8] },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
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

        {isBoxStillLocked && teasers.length > 0 && (
          <View style={styles.teaserSection}>
            <View style={styles.teaserHeader}>
              <Ionicons name="sparkles-outline" size={18} color={config.color} />
              <Text style={styles.teaserTitle}>Gợi ý đã mở khóa</Text>
            </View>

            {unlockedTeasers.length > 0 ? (
              <View style={styles.teaserList}>
                {unlockedTeasers.map((teaser) => (
                  <View key={teaser.id} style={styles.teaserCard}>
                    <Text style={styles.teaserText}>{teaser.teaserText}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.teaserHint}>
                Một vài gợi ý sẽ xuất hiện khi gần đến ngày mở...
              </Text>
            )}

            {waitingTeaserCount > 0 && (
              <Text style={styles.teaserWaitingText}>
                Còn {waitingTeaserCount} gợi ý đang chờ
              </Text>
            )}
          </View>
        )}

        {!box.openedAt && (
          <View style={styles.predictionSection}>
            <View style={styles.predictionHeader}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={config.color} />
              <Text style={styles.predictionTitle}>Dự đoán của bạn</Text>
            </View>
            <TextInput
              style={styles.predictionInput}
              value={predictionText}
              onChangeText={(value) => {
                setPredictionText(value.slice(0, 500));
                setPredictionSaved(false);
              }}
              placeholder="Bạn nghĩ bên trong hộp này là gì?"
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
            <View style={styles.predictionFooter}>
              <Text style={styles.predictionCount}>{predictionText.length}/500</Text>
              {predictionSaved && (
                <Text style={[styles.predictionSavedText, { color: config.color }]}>
                  Đã lưu
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.savePredictionButton,
                { backgroundColor: config.color },
                isSavingPrediction && styles.savePredictionButtonDisabled,
              ]}
              onPress={handleSavePrediction}
              activeOpacity={0.85}
              disabled={isSavingPrediction}
            >
              <Ionicons name="save-outline" size={18} color={Colors.textOnColor} />
              <Text style={styles.savePredictionText}>
                {isSavingPrediction ? 'Đang lưu...' : 'Lưu dự đoán'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.danger} />
          <Text style={styles.deleteButtonText}>Xóa hộp</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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

  scroll: { flex: 1 },

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

  teaserSection: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing[4],
    marginTop: Spacing[2],
  },
  teaserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  teaserTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  teaserList: {
    gap: Spacing[2],
  },
  teaserCard: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
  },
  teaserText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: FontSize.md * 1.45,
  },
  teaserHint: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: FontSize.md * 1.45,
  },
  teaserWaitingText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing[3],
  },

  predictionSection: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing[4],
    marginTop: Spacing[2],
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  predictionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  predictionInput: {
    minHeight: 112,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.surfaceSecondary,
    lineHeight: FontSize.md * 1.45,
  },
  predictionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 28,
    marginTop: Spacing[2],
  },
  predictionCount: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  predictionSavedText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
  },
  savePredictionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    minHeight: 48,
    paddingHorizontal: Spacing[4],
    borderRadius: Radius.md,
    marginTop: Spacing[2],
  },
  savePredictionButtonDisabled: {
    opacity: 0.6,
  },
  savePredictionText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
    color: Colors.textOnColor,
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
