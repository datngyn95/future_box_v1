// Lock Success Screen — FutureBoxes
// Xác nhận hộp đã khóa thành công, cảm giác hoàn tất cảm xúc.
// Screen: 8. Lock Success Screen (screens.md)

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
} from 'react-native-reanimated';

import { Colors } from '../../src/constants/colors';
import { Spacing, Radius, Shadow } from '../../src/constants/spacing';
import { FontSize, FontWeight } from '../../src/constants/typography';
import { getBoxTypeConfig } from '../../src/constants/boxTypes';
import { BoxType } from '../../src/types/box';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AUTO_NAVIGATE_SECONDS = 5;

function formatViDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

function getDaysRemaining(isoString: string): number {
  const unlock = new Date(isoString).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((unlock - now) / (1000 * 60 * 60 * 24)));
}

// ─── Burst Particle ───────────────────────────────────────────────────────────

interface ParticleProps {
  angle: number;
  color: string;
  delay: number;
}

function BurstParticle({ angle, color, delay }: ParticleProps) {
  const distance = 60 + Math.random() * 30;
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const rad = (angle * Math.PI) / 180;
      opacity.value = withTiming(1, { duration: 100 });
      scale.value = withSpring(1, { damping: 12, stiffness: 300 });
      translateX.value = withTiming(Math.cos(rad) * distance, {
        duration: 600,
        easing: Easing.out(Easing.quad),
      });
      translateY.value = withTiming(Math.sin(rad) * distance - 20, {
        duration: 600,
        easing: Easing.out(Easing.quad),
      });
      setTimeout(() => {
        opacity.value = withTiming(0, { duration: 300 });
      }, 500);
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  const particleStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        { backgroundColor: color },
        particleStyle,
      ]}
    />
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LockSuccessScreen() {
  const { boxType, title, unlockDate } = useLocalSearchParams<{
    boxType: string;
    title: string;
    unlockDate: string;
  }>();

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const config = getBoxTypeConfig((boxType ?? 'message') as BoxType);

  const [countdown, setCountdown] = useState(AUTO_NAVIGATE_SECONDS);
  const autoNavTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animation shared values
  const illustrationScale = useSharedValue(0.6);
  const illustrationOpacity = useSharedValue(0);
  const lockIconRotate = useSharedValue(-15);

  const line1Opacity = useSharedValue(0);
  const line1Y = useSharedValue(10);
  const line2Opacity = useSharedValue(0);
  const line2Y = useSharedValue(10);
  const line3Opacity = useSharedValue(0);
  const line3Y = useSharedValue(10);
  const btnOpacity = useSharedValue(0);
  const btnScale = useSharedValue(0.92);

  // Progress bar width (0 → 1)
  const progressWidth = useSharedValue(1);

  // Home button press scale
  const homeBtnPressScale = useSharedValue(1);

  const illustrationStyle = useAnimatedStyle(() => ({
    opacity: illustrationOpacity.value,
    transform: [{ scale: illustrationScale.value }],
  }));

  const lockIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${lockIconRotate.value}deg` }],
  }));

  const line1Style = useAnimatedStyle(() => ({
    opacity: line1Opacity.value,
    transform: [{ translateY: line1Y.value }],
  }));
  const line2Style = useAnimatedStyle(() => ({
    opacity: line2Opacity.value,
    transform: [{ translateY: line2Y.value }],
  }));
  const line3Style = useAnimatedStyle(() => ({
    opacity: line3Opacity.value,
    transform: [{ translateY: line3Y.value }],
  }));
  const btnStyle = useAnimatedStyle(() => ({
    opacity: btnOpacity.value,
    transform: [{ scale: btnScale.value * homeBtnPressScale.value }],
  }));
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%` as unknown as number,
  }));

  useEffect(() => {
    // Illustration entrance
    illustrationOpacity.value = withTiming(1, { duration: 400 });
    illustrationScale.value = withSpring(1, { damping: 14, stiffness: 200 });

    // Lock click animation
    lockIconRotate.value = withSequence(
      withTiming(-15, { duration: 0 }),
      withSpring(0, { damping: 8, stiffness: 300 }),
    );

    // Text stagger
    const showLine = (
      opacity: typeof line1Opacity,
      y: typeof line1Y,
      delay: number,
    ) => {
      setTimeout(() => {
        opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) });
        y.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) });
      }, delay);
    };

    showLine(line1Opacity, line1Y, 300);
    showLine(line2Opacity, line2Y, 500);
    showLine(line3Opacity, line3Y, 700);

    // Button fade in
    setTimeout(() => {
      btnOpacity.value = withTiming(1, { duration: 350 });
      btnScale.value = withSpring(1, { damping: 14, stiffness: 250 });
    }, 900);

    // Progress bar countdown
    progressWidth.value = withTiming(0, {
      duration: AUTO_NAVIGATE_SECONDS * 1000,
      easing: Easing.linear,
    });

    // Countdown text
    countdownInterval.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-navigate
    autoNavTimer.current = setTimeout(() => {
      navigateHome();
    }, AUTO_NAVIGATE_SECONDS * 1000);

    return () => {
      if (autoNavTimer.current) clearTimeout(autoNavTimer.current);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, []);

  const navigateHome = () => {
    if (autoNavTimer.current) clearTimeout(autoNavTimer.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    // Replace the entire create-box stack back to home
    router.dismissAll();
  };

  const handleHomePress = () => {
    navigateHome();
  };

  const handleHomePressIn = () => {
    homeBtnPressScale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  };
  const handleHomePressOut = () => {
    homeBtnPressScale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const daysRemaining = getDaysRemaining(unlockDate ?? new Date().toISOString());
  const formattedDate = formatViDate(unlockDate ?? new Date().toISOString());

  // Generate burst particle angles
  const particleAngles = Array.from({ length: 6 }, (_, i) => i * 60);

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      {/* Gradient background using box type color */}
      <View
        style={[
          styles.gradientTop,
          { backgroundColor: config.bgColor },
        ]}
      />

      {/* Content */}
      <View style={[styles.content, { paddingTop: insets.top + Spacing[8] }]}>
        {/* Illustration */}
        <View style={styles.illustrationWrapper}>
          <Animated.View style={[styles.illustrationContainer, illustrationStyle, { backgroundColor: config.bgColor }]}>
            {/* Burst particles */}
            {particleAngles.map((angle, i) => (
              <BurstParticle
                key={i}
                angle={angle}
                color={config.color}
                delay={200 + i * 40}
              />
            ))}

            {/* Lock icon with animation */}
            <Animated.View style={lockIconStyle}>
              <Ionicons name="lock-closed" size={80} color={config.color} />
            </Animated.View>

            {/* Box type icon badge */}
            <View style={[styles.typeBadge, { backgroundColor: config.color }]}>
              <Ionicons
                name={config.iconName as keyof typeof Ionicons.glyphMap}
                size={16}
                color={Colors.textOnColor}
              />
            </View>
          </Animated.View>
        </View>

        {/* Text messages */}
        <View style={styles.textContainer}>
          <Animated.Text style={[styles.successTitle, line1Style]}>
            Hộp đã được khóa!
          </Animated.Text>

          <Animated.Text style={[styles.dateMessage, line2Style]}>
            Hẹn gặp lại vào{'\n'}
            <Text style={[styles.dateBold, { color: config.color }]}>
              {formattedDate}
            </Text>
          </Animated.Text>

          <Animated.Text style={[styles.daysMessage, line3Style]}>
            Hộp sẽ mở sau{' '}
            <Text style={[styles.daysBold, { color: config.color }]}>
              {daysRemaining} ngày
            </Text>{' '}
            nữa.
          </Animated.Text>
        </View>

        {/* Home button */}
        <Animated.View style={[styles.buttonWrapper, btnStyle]}>
          <Pressable
            onPress={handleHomePress}
            onPressIn={handleHomePressIn}
            onPressOut={handleHomePressOut}
            style={[styles.homeButton, { backgroundColor: config.color }]}
          >
            <Ionicons name="home" size={20} color={Colors.textOnColor} style={{ marginRight: Spacing[2] }} />
            <Text style={styles.homeButtonText}>Về trang chủ</Text>
          </Pressable>

          {/* Auto-navigate countdown */}
          <Text style={styles.countdownText}>
            Tự động chuyển về trang chủ sau {countdown} giây
          </Text>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                { backgroundColor: config.color },
                progressStyle,
              ]}
            />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Background gradient simulation (top tinted area)
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    opacity: 0.4,
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[6],
    gap: Spacing[6],
  },

  // Illustration
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
    overflow: 'visible',
  },
  typeBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },

  // Burst particle
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Text
  textContainer: {
    alignItems: 'center',
    gap: Spacing[3],
  },
  successTitle: {
    fontSize: FontSize['5xl'],
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  dateMessage: {
    fontSize: FontSize['3xl'],
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize['3xl'] * 1.4,
  },
  dateBold: {
    fontWeight: FontWeight.bold,
    fontSize: FontSize['3xl'],
  },
  daysMessage: {
    fontSize: FontSize.lg,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  daysBold: {
    fontWeight: FontWeight.bold,
    fontSize: FontSize.lg,
  },

  // Button
  buttonWrapper: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing[2],
  },
  homeButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  homeButtonText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semiBold,
    color: Colors.textOnColor,
  },
  countdownText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing[1],
  },
  progressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: Colors.progressTrack,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginTop: Spacing[1],
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
});
