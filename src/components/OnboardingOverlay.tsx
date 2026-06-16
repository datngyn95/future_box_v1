// OnboardingOverlay — màn hình chào lần đầu (F-19)
// 3 slides: Concept → Cách hoạt động → Cảm xúc
// Render như overlay, quản lý bởi AppGuard

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';

import { Colors } from '../constants/colors';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { FontSize, FontWeight } from '../constants/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  onComplete: () => void;
}

const SLIDES = [
  {
    icon: 'cube' as const,
    iconColor: Colors.primary,
    iconBg: Colors.primaryLight,
    title: 'Gửi thư cho chính mình\ntrong tương lai',
    desc: 'Khóa suy nghĩ, mục tiêu và kỷ niệm của bạn lại — chỉ bạn trong tương lai mới được đọc.',
  },
  {
    icon: 'list-circle' as const,
    iconColor: Colors.boxType.goal,
    iconBg: Colors.boxType.goalBg,
    title: 'Đơn giản, chỉ 3 bước',
    desc: '',
    steps: [
      { icon: 'create-outline' as const, label: 'Viết nội dung', color: Colors.primary },
      { icon: 'lock-closed-outline' as const, label: 'Chọn ngày mở', color: Colors.boxType.decision },
      { icon: 'cube-outline' as const, label: 'Khám phá bất ngờ', color: Colors.boxType.goal },
    ],
  },
  {
    icon: 'happy' as const,
    iconColor: Colors.boxType.decision,
    iconBg: Colors.boxType.decisionBg,
    title: 'Mở hộp —\nkhoảnh khắc đáng nhớ',
    desc: 'Khi đến hạn, hãy tự tặng mình một khoảnh khắc bất ngờ và suy ngẫm về hành trình đã qua.',
  },
];

// ─── Dot Indicator ────────────────────────────────────────────────────────────

function Dot({ active }: { active: boolean }) {
  const width = useSharedValue(active ? 24 : 8);
  useEffect(() => {
    width.value = withSpring(active ? 24 : 8, { damping: 15, stiffness: 200 });
  }, [active]);
  const style = useAnimatedStyle(() => ({ width: width.value }));
  return (
    <Animated.View
      style={[dotStyles.dot, active ? dotStyles.dotActive : dotStyles.dotInactive, style]}
    />
  );
}

function DotIndicator({ total, current }: { total: number; current: number }) {
  return (
    <View style={dotStyles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <Dot key={i} active={i === current} />
      ))}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing[2], alignItems: 'center' },
  dot: { height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: Colors.primary },
  dotInactive: { backgroundColor: Colors.borderMedium },
});

// ─── Slide ────────────────────────────────────────────────────────────────────

function Slide({ slide, isActive }: { slide: typeof SLIDES[0]; isActive: boolean }) {
  const floatY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    if (isActive) {
      floatY.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.quad) });
    } else {
      floatY.value = 0;
    }
  }, [isActive]);

  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: floatY.value }] }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={slideStyles.container}>
      {/* Icon */}
      <Animated.View style={[slideStyles.iconWrapper, floatStyle]}>
        <View style={[slideStyles.iconCircle, { backgroundColor: slide.iconBg }]}>
          <Ionicons name={slide.icon} size={72} color={slide.iconColor} />
        </View>
      </Animated.View>

      <Animated.View style={[slideStyles.textContent, contentStyle]}>
        <Text style={slideStyles.title}>{slide.title}</Text>

        {slide.steps ? (
          <View style={slideStyles.stepsContainer}>
            {slide.steps.map((step, i) => (
              <View key={i} style={slideStyles.stepRow}>
                <View style={[slideStyles.stepIcon, { backgroundColor: slide.iconBg }]}>
                  <Ionicons name={step.icon} size={22} color={step.color} />
                </View>
                <Text style={slideStyles.stepLabel}>{step.label}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={slideStyles.desc}>{slide.desc}</Text>
        )}
      </Animated.View>
    </View>
  );
}

const slideStyles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[8],
    gap: Spacing[6],
  },
  iconWrapper: { marginBottom: Spacing[2] },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: { alignItems: 'center', gap: Spacing[4] },
  title: {
    fontSize: FontSize['4xl'],
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: FontSize['4xl'] * 1.3,
  },
  desc: {
    fontSize: FontSize.xl,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.xl * 1.6,
  },
  stepsContainer: { gap: Spacing[3], width: '100%' },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
});

// ─── Main ─────────────────────────────────────────────────────────────────────

export function OnboardingOverlay({ onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleNext = useCallback(() => {
    if (current < SLIDES.length - 1) {
      const next = current + 1;
      setCurrent(next);
      scrollRef.current?.scrollTo({ x: SCREEN_WIDTH * next, animated: true });
    } else {
      onComplete();
    }
  }, [current, onComplete]);

  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const isLast = current === SLIDES.length - 1;

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={styles.slider}
      >
        {SLIDES.map((slide, i) => (
          <Slide key={i} slide={slide} isActive={i === current} />
        ))}
      </ScrollView>

      {/* Bottom controls */}
      <View style={styles.controls}>
        <DotIndicator total={SLIDES.length} current={current} />

        <TouchableOpacity
          style={styles.nextBtn}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>
            {isLast ? 'Bắt đầu' : 'Tiếp theo'}
          </Text>
          <Ionicons name={isLast ? 'rocket' : 'arrow-forward'} size={18} color={Colors.textOnColor} />
        </TouchableOpacity>

        {!isLast && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Bỏ qua</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    backgroundColor: Colors.background,
    zIndex: 9998,
  },
  slider: {
    flex: 1,
  },
  controls: {
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[6],
    gap: Spacing[3],
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.primary,
    width: '100%',
    paddingVertical: Spacing[4],
    borderRadius: Radius.full,
    ...Shadow.md,
  },
  nextBtnText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semiBold,
    color: Colors.textOnColor,
  },
  skipBtn: { paddingVertical: Spacing[2] },
  skipText: {
    fontSize: FontSize.lg,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
});
