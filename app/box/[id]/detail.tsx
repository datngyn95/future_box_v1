// Opened Box Detail Screen — nội dung hộp đã mở (F-07, F-11, F-16)
// Hiển thị opening note, nội dung gốc, ảnh, reflection question + confetti

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as FileSystem from 'expo-file-system/legacy';

import { Colors } from '../../../src/constants/colors';
import { Spacing, Radius, Shadow } from '../../../src/constants/spacing';
import { FontSize, FontWeight } from '../../../src/constants/typography';
import { getBoxTypeConfig } from '../../../src/constants/boxTypes';
import { BoxIcon } from '../../../src/components/BoxIcon';
import { useBoxStore } from '../../../src/store/boxStore';
import { answerReflectionQuestion } from '../../../src/db/boxRepository';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Confetti ─────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  '#FF6B6B', '#FFE66D', '#4ECDC4', '#A8E6CF',
  '#FF8B94', '#6C5CE7', '#FDCB6E', '#00CEC9',
  '#E17055', '#74B9FF', '#FD79A8', '#55EFC4',
];

interface ParticleData {
  id: number;
  x: number;
  delay: number;
  color: string;
  size: number;
  drift: number;
}

function ConfettiParticle({ x, delay, color, size, drift }: Omit<ParticleData, 'id'>) {
  const translateY = useSharedValue(-size * 2);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 100 }));
    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT + 40, { duration: 2800, easing: Easing.in(Easing.quad) }),
    );
    translateX.value = withDelay(
      delay,
      withTiming(drift, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
    );
    rotate.value = withDelay(
      delay,
      withTiming(drift > 0 ? 540 : -540, { duration: 2800, easing: Easing.linear }),
    );
    opacity.value = withDelay(delay + 2000, withTiming(0, { duration: 800 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: x,
    top: 0,
    width: size,
    height: size * 0.45,
    backgroundColor: color,
    borderRadius: size * 0.1,
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return <Animated.View style={style} />;
}

function ConfettiOverlay({ onDismiss }: { onDismiss: () => void }) {
  const particles = useMemo<ParticleData[]>(() =>
    Array.from({ length: 55 }, (_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      delay: Math.random() * 600,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 7 + Math.random() * 9,
      drift: (Math.random() - 0.5) * 120,
    })),
  []);

  const messageScale = useSharedValue(0.5);
  const messageOpacity = useSharedValue(0);

  useEffect(() => {
    messageScale.value = withDelay(
      300,
      withSpring(1, { damping: 12, stiffness: 200 }),
    );
    messageOpacity.value = withDelay(300, withTiming(1, { duration: 300 }));
  }, []);

  const messageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: messageScale.value }],
    opacity: messageOpacity.value,
  }));

  return (
    <Modal transparent animationType="fade" onRequestClose={onDismiss}>
      <TouchableOpacity
        style={styles.confettiOverlay}
        activeOpacity={1}
        onPress={onDismiss}
      >
        {particles.map((p) => (
          <ConfettiParticle
            key={p.id}
            x={p.x}
            delay={p.delay}
            color={p.color}
            size={p.size}
            drift={p.drift}
          />
        ))}
        <Animated.View style={[styles.confettiMessage, messageStyle]}>
          <Text style={styles.confettiEmoji}>🎉</Text>
          <Text style={styles.confettiTitle}>Tuyệt vời!</Text>
          <Text style={styles.confettiSubtitle}>Bạn đã làm được rồi!</Text>
          <TouchableOpacity
            onPress={onDismiss}
            style={styles.confettiDismissBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.confettiDismissText}>Đóng</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Empathy Card ─────────────────────────────────────────────────────────────

const EMPATHY_MESSAGES: Record<string, string> = {
  goal: 'Không sao cả! Hành trình quan trọng hơn đích đến. Hãy thử lại nhé.',
  decision: 'Mỗi quyết định đều là bài học. Bạn đã dũng cảm hơn rồi đó.',
  message: 'Mọi thứ sẽ tốt hơn. Tạo một hộp mới để ghi lại bước tiếp theo nhé.',
  memory: 'Kỷ niệm đẹp hay chưa đẹp đều là một phần của bạn. Cảm ơn bạn đã nhớ lại.',
};

function EmpathyCard({
  boxType,
  onCreateNew,
  onDismiss,
}: {
  boxType: string;
  onCreateNew: () => void;
  onDismiss: () => void;
}) {
  const translateY = useSharedValue(80);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 200 }));
    opacity.value = withDelay(200, withTiming(1, { duration: 300 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Modal transparent animationType="fade" onRequestClose={onDismiss}>
      <TouchableOpacity
        style={styles.empathyOverlay}
        activeOpacity={1}
        onPress={onDismiss}
      >
        <Animated.View style={[styles.empathyCard, style]}>
          <Ionicons name="heart" size={32} color="#E17055" />
          <Text style={styles.empathyText}>
            {EMPATHY_MESSAGES[boxType] ?? EMPATHY_MESSAGES.message}
          </Text>
          <TouchableOpacity
            style={styles.empathyCreateBtn}
            onPress={onCreateNew}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
            <Text style={styles.empathyCreateText}>Tạo hộp mới</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDismiss} style={styles.empathyDismissBtn}>
            <Text style={styles.empathyDismissText}>Đóng</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function OpenedBoxDetailScreen() {
  const { id, isFirstOpen } = useLocalSearchParams<{ id: string; isFirstOpen?: string }>();
  const router = useRouter();
  const { state, dispatch } = useBoxStore();
  const insets = useSafeAreaInsets();

  const box = state.boxes.find((b) => b.id === id);
  const config = box ? getBoxTypeConfig(box.boxType) : null;

  const firstOpen = isFirstOpen === '1';

  // Reflection answer state
  const [localAnswer, setLocalAnswer] = useState<'yes' | 'no' | null>(
    box?.reflectionAnswer ?? null,
  );
  const [showConfetti, setShowConfetti] = useState(false);
  const [showEmpathy, setShowEmpathy] = useState(false);
  // Confetti chỉ chạy lần đầu trả lời "Có" (không chạy lại khi đổi câu trả lời)
  const confettiShownRef = useRef(box?.reflectionAnswer === 'yes');
  const [showAnswerButtons, setShowAnswerButtons] = useState(
    box?.reflectionAnswer === null || box?.reflectionAnswer === undefined,
  );
  const [imageError, setImageError] = useState(false);

  // Stagger fade-in + slide-up for content sections (F-14)
  const section1Opacity = useSharedValue(0);
  const section2Opacity = useSharedValue(0);
  const section3Opacity = useSharedValue(0);
  const section4Opacity = useSharedValue(0);
  const section1TransY = useSharedValue(firstOpen ? 24 : 0);
  const section2TransY = useSharedValue(firstOpen ? 24 : 0);
  const section3TransY = useSharedValue(firstOpen ? 24 : 0);
  const section4TransY = useSharedValue(firstOpen ? 24 : 0);

  useEffect(() => {
    const base = firstOpen ? 300 : 0;
    const dur = 450;
    const ease = Easing.out(Easing.quad);
    section1Opacity.value = withDelay(base, withTiming(1, { duration: dur }));
    section2Opacity.value = withDelay(base + 150, withTiming(1, { duration: dur }));
    section3Opacity.value = withDelay(base + 300, withTiming(1, { duration: dur }));
    section4Opacity.value = withDelay(base + 450, withTiming(1, { duration: dur }));
    if (firstOpen) {
      section1TransY.value = withDelay(base, withTiming(0, { duration: dur, easing: ease }));
      section2TransY.value = withDelay(base + 150, withTiming(0, { duration: dur, easing: ease }));
      section3TransY.value = withDelay(base + 300, withTiming(0, { duration: dur, easing: ease }));
      section4TransY.value = withDelay(base + 450, withTiming(0, { duration: dur, easing: ease }));
    }
  }, []);

  const s1Style = useAnimatedStyle(() => ({
    opacity: section1Opacity.value,
    transform: [{ translateY: section1TransY.value }],
  }));
  const s2Style = useAnimatedStyle(() => ({
    opacity: section2Opacity.value,
    transform: [{ translateY: section2TransY.value }],
  }));
  const s3Style = useAnimatedStyle(() => ({
    opacity: section3Opacity.value,
    transform: [{ translateY: section3TransY.value }],
  }));
  const s4Style = useAnimatedStyle(() => ({
    opacity: section4Opacity.value,
    transform: [{ translateY: section4TransY.value }],
  }));

  const handleAnswer = useCallback(
    async (answer: 'yes' | 'no') => {
      if (!box) return;
      try {
        await answerReflectionQuestion(box.id, answer);
        const updatedBox = { ...box, reflectionAnswer: answer };
        dispatch({ type: 'UPDATE_BOX', payload: updatedBox });
        setLocalAnswer(answer);
        setShowAnswerButtons(false);

        if (answer === 'yes' && !confettiShownRef.current) {
          confettiShownRef.current = true;
          setShowConfetti(true);
        } else if (answer === 'no') {
          setShowEmpathy(true);
        }
      } catch {
        Alert.alert('Lỗi', 'Không thể lưu câu trả lời. Vui lòng thử lại.');
      }
    },
    [box, dispatch],
  );

  const handleSkip = useCallback(() => {
    setShowAnswerButtons(false);
  }, []);

  const handleChangeAnswer = useCallback(() => {
    setShowAnswerButtons(true);
  }, []);

  if (!box || !config) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.errorText}>Không tìm thấy hộp</Text>
      </View>
    );
  }

  const displayTitle = box.title || config.label;
  const hasQuestion = !!box.reflectionQuestion;
  const hasOpeningNote = !!box.openingNote;
  const hasImage = !!box.imagePath && !imageError;

  return (
    <View style={[styles.root, { backgroundColor: Colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing[8] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero gradient header ── */}
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
            <View style={styles.headerBtn} />
          </View>

          <View style={styles.heroIconRow}>
            <BoxIcon boxType={box.boxType} size={60} showLockOverlay={false} />
          </View>
        </LinearGradient>

        {/* ── Opening Note (F-16) ── */}
        {hasOpeningNote && (
          <Animated.View style={[styles.section, s1Style]}>
            <View style={styles.openingNoteCard}>
              <View style={styles.openingNoteHeader}>
                <Ionicons name="mail-open-outline" size={16} color={config.color} />
                <Text style={[styles.sectionLabel, { color: config.color }]}>
                  LỜI NHẮN KHI MỞ
                </Text>
              </View>
              <Text style={styles.openingNoteText}>{box.openingNote}</Text>
              <Text style={styles.openingNoteDate}>
                Gửi lúc {formatDate(box.createdAt)}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ── Box meta ── */}
        <Animated.View style={[styles.section, s2Style]}>
          <View style={styles.metaRow}>
            <View style={[styles.typeBadge, { backgroundColor: config.bgColor }]}>
              <Text style={[styles.typeBadgeText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
            <Text style={styles.metaDateText}>
              Tạo {formatDate(box.createdAt)} · Mở {formatDate(box.openedAt || box.unlockDate)}
            </Text>
          </View>
        </Animated.View>

        {/* ── Original content ── */}
        <Animated.View style={[styles.section, s3Style]}>
          <Text style={styles.sectionLabel}>NỘI DUNG GỐC</Text>
          <View style={styles.contentCard}>
            <Text style={styles.contentText} selectable>
              {box.content}
            </Text>
          </View>
        </Animated.View>

        {/* ── Image (F-10) ── */}
        {box.imagePath && (
          <Animated.View style={[styles.section, s3Style]}>
            {imageError ? (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={32} color={Colors.textMuted} />
                <Text style={styles.imagePlaceholderText}>Ảnh không khả dụng</Text>
              </View>
            ) : (
              <Image
                source={{ uri: box.imagePath }}
                style={styles.contentImage}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            )}
          </Animated.View>
        )}

        {/* ── Reflection question (F-07) ── */}
        {hasQuestion && (
          <Animated.View style={[styles.section, s4Style]}>
            <Text style={styles.sectionLabel}>CÂU HỎI</Text>
            <View style={styles.questionCard}>
              <Text style={styles.questionText}>{box.reflectionQuestion}</Text>

              {showAnswerButtons ? (
                <>
                  <View style={styles.answerRow}>
                    {/* Yes */}
                    <TouchableOpacity
                      style={[styles.answerBtn, styles.answerBtnYes]}
                      onPress={() => handleAnswer('yes')}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                      <Text style={[styles.answerBtnText, { color: '#FFFFFF' }]}>Có</Text>
                    </TouchableOpacity>
                    {/* No */}
                    <TouchableOpacity
                      style={[styles.answerBtn, styles.answerBtnNo]}
                      onPress={() => handleAnswer('no')}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="close" size={20} color={Colors.danger} />
                      <Text style={[styles.answerBtnText, { color: Colors.danger }]}>Không</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
                    <Text style={styles.skipBtnText}>Bỏ qua</Text>
                  </TouchableOpacity>
                </>
              ) : localAnswer !== null ? (
                <View style={styles.answeredRow}>
                  <View
                    style={[
                      styles.answerBadge,
                      {
                        backgroundColor:
                          localAnswer === 'yes' ? Colors.successLight : Colors.dangerLight,
                      },
                    ]}
                  >
                    <Ionicons
                      name={localAnswer === 'yes' ? 'checkmark-circle' : 'close-circle'}
                      size={18}
                      color={localAnswer === 'yes' ? Colors.success : Colors.danger}
                    />
                    <Text
                      style={[
                        styles.answerBadgeText,
                        {
                          color: localAnswer === 'yes' ? Colors.success : Colors.danger,
                        },
                      ]}
                    >
                      {localAnswer === 'yes' ? 'Bạn đã trả lời: Có ✓' : 'Bạn đã trả lời: Không'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleChangeAnswer} style={styles.changeAnswerBtn}>
                    <Text style={styles.changeAnswerText}>Đổi câu trả lời</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Skipped — still allow answering
                <TouchableOpacity onPress={handleChangeAnswer} style={styles.changeAnswerBtn}>
                  <Text style={styles.changeAnswerText}>Trả lời câu hỏi</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* ── Confetti overlay (F-07 AC-07.1) ── */}
      {showConfetti && (
        <ConfettiOverlay onDismiss={() => setShowConfetti(false)} />
      )}

      {/* ── Empathy card (F-07 AC-07.2) ── */}
      {showEmpathy && (
        <EmpathyCard
          boxType={box.boxType}
          onCreateNew={() => {
            setShowEmpathy(false);
            router.push('/create-box');
          }}
          onDismiss={() => setShowEmpathy(false)}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: FontSize.xl, color: Colors.textSecondary },

  scrollContent: {
    flexGrow: 1,
  },

  // Hero
  hero: {
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[5],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing[3],
    marginBottom: Spacing[3],
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
  heroIconRow: {
    alignItems: 'center',
  },

  // Sections
  section: {
    paddingHorizontal: Spacing[4],
    marginTop: Spacing[4],
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: Spacing[2],
  },

  // Opening Note
  openingNoteCard: {
    backgroundColor: '#FFFBF0',
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: '#FFE9A0',
    ...Shadow.sm,
  },
  openingNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  openingNoteText: {
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    lineHeight: FontSize.lg * 1.6,
    fontStyle: 'italic',
  },
  openingNoteDate: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing[2],
  },

  // Meta row
  metaRow: {
    gap: Spacing[2],
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing[3],
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  typeBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
  },
  metaDateText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },

  // Content card
  contentCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.sm,
  },
  contentText: {
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    lineHeight: FontSize.xl * 1.6,
  },

  // Image
  contentImage: {
    width: '100%',
    height: 220,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceSecondary,
  },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  imagePlaceholderText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },

  // Question card
  questionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.sm,
    gap: Spacing[4],
  },
  questionText: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: FontSize['3xl'] * 1.4,
  },

  answerRow: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  answerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[4],
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  answerBtnYes: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  answerBtnNo: {
    backgroundColor: Colors.surface,
    borderColor: Colors.danger,
  },
  answerBtnText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semiBold,
  },

  skipBtn: {
    alignItems: 'center',
    paddingVertical: Spacing[2],
  },
  skipBtnText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },

  answeredRow: {
    gap: Spacing[2],
    alignItems: 'center',
  },
  answerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderRadius: Radius.lg,
  },
  answerBadgeText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semiBold,
  },
  changeAnswerBtn: {
    paddingVertical: Spacing[2],
  },
  changeAnswerText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },

  // Confetti overlay
  confettiOverlay: {
    ...{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confettiMessage: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: Spacing[6],
    alignItems: 'center',
    gap: Spacing[2],
    marginHorizontal: Spacing[8],
    ...Shadow.lg,
  },
  confettiEmoji: {
    fontSize: 48,
  },
  confettiTitle: {
    fontSize: FontSize['4xl'],
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  confettiSubtitle: {
    fontSize: FontSize.xl,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  confettiDismissBtn: {
    marginTop: Spacing[2],
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[6],
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
  },
  confettiDismissText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semiBold,
    color: Colors.primary,
  },

  // Empathy overlay
  empathyOverlay: {
    ...{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  empathyCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing[6],
    alignItems: 'center',
    gap: Spacing[3],
    ...Shadow.lg,
  },
  empathyText: {
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: FontSize.xl * 1.6,
  },
  empathyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderRadius: Radius.full,
    marginTop: Spacing[1],
  },
  empathyCreateText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semiBold,
    color: Colors.primary,
  },
  empathyDismissBtn: {
    paddingVertical: Spacing[2],
  },
  empathyDismissText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
});
