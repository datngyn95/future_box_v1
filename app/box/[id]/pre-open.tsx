// Pre-open Screen — "khoảnh khắc nghi thức" trước khi mở hộp (F-06)
// AC-06.1: người dùng phải chủ động nhấn "Mở hộp", không tự động mở

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

import { Colors } from '../../../src/constants/colors';
import { Spacing, Radius, Shadow } from '../../../src/constants/spacing';
import { FontSize, FontWeight } from '../../../src/constants/typography';
import { getBoxTypeConfig } from '../../../src/constants/boxTypes';
import { BoxIcon } from '../../../src/components/BoxIcon';
import {
  OpeningRitualOverlay,
  OPENING_RITUAL_DURATION_MS,
} from '../../../src/components/OpeningRitualOverlay';
import { useBoxStore, getBoxStatus } from '../../../src/store/boxStore';
import { openBox } from '../../../src/db/boxRepository';
import { hapticImpactLight, hapticSuccess } from '../../../src/services/hapticsService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MOTIVATIONAL_MESSAGES = [
  'Bạn của quá khứ có điều muốn nói...',
  'Đã đến lúc rồi! Hộp thời gian của bạn đang chờ.',
  'Khoảnh khắc này chính bạn đã tự tạo ra.',
  'Một thông điệp từ quá khứ đang chờ bạn.',
  'Hành trình thời gian của bạn đã đến đích.',
];

function formatDateFull(dateString: string): string {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function PreOpenScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { state, dispatch } = useBoxStore();
  const insets = useSafeAreaInsets();
  const [isOpening, setIsOpening] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'ritual'>('idle');
  const hasNavigatedRef = useRef(false);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const box = state.boxes.find((b) => b.id === id);
  const config = box ? getBoxTypeConfig(box.boxType) : null;
  const boxId = box?.id;

  // Nếu hộp đã mở trước đó, redirect thẳng sang detail
  useEffect(() => {
    if (box && box.openedAt && !isOpening && phase !== 'ritual') {
      router.replace(`/box/${box.id}/detail`);
    }
  }, [box, isOpening, phase, router]);

  useEffect(() => {
    return () => {
      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
      }
    };
  }, []);

  const goDetail = useCallback(() => {
    if (!boxId || hasNavigatedRef.current) return;

    hasNavigatedRef.current = true;
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
    void hapticSuccess();
    router.replace({
      pathname: `/box/${boxId}/detail`,
      params: { isFirstOpen: '1' },
    });
  }, [boxId, router]);

  const msgIndex = box ? box.id.charCodeAt(0) % MOTIVATIONAL_MESSAGES.length : 0;
  const motivationalMsg = MOTIVATIONAL_MESSAGES[msgIndex];

  // Animations
  const floatY = useSharedValue(0);
  const lightOpacity = useSharedValue(0.5);
  const infoOpacity = useSharedValue(0);
  const infoTranslateY = useSharedValue(20);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    // Box float loop
    floatY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    // Glow pulse
    lightOpacity.value = withRepeat(
      withSequence(
        withTiming(1.0, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.5, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    // Info fade-in
    infoOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) });
    infoTranslateY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) });
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const lightStyle = useAnimatedStyle(() => ({
    opacity: lightOpacity.value,
  }));

  const infoStyle = useAnimatedStyle(() => ({
    opacity: infoOpacity.value,
    transform: [{ translateY: infoTranslateY.value }],
  }));

  const buttonPressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleOpen = useCallback(async () => {
    if (!box || isOpening || phase === 'ritual') return;

    // Guard: chống tua giờ ngược (AC-03.4)
    if (getBoxStatus(box) !== 'ready_to_open') return;

    setIsOpening(true);
    hasNavigatedRef.current = false;
    void hapticImpactLight();
    buttonScale.value = withSpring(0.96, { damping: 15, stiffness: 400 });

    try {
      await openBox(box.id);
      const openedAt = new Date().toISOString();
      dispatch({
        type: 'UPDATE_BOX',
        payload: { ...box, openedAt, status: 'opened' },
      });
      setPhase('ritual');
      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
      }
      safetyTimerRef.current = setTimeout(
        goDetail,
        OPENING_RITUAL_DURATION_MS + 250,
      );
    } catch {
      setIsOpening(false);
      setPhase('idle');
      buttonScale.value = withSpring(1);
    }
  }, [box, isOpening, phase, dispatch, goDetail]);

  if (!box || !config) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.errorText}>Không tìm thấy hộp</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: Colors.background }]}>
      {/* Hero area */}
      <LinearGradient
        colors={['#FFF8E1', '#FFFDE7', Colors.background]}
        locations={[0, 0.6, 1]}
        style={[styles.hero, { paddingTop: insets.top }]}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hộp sẵn sàng!</Text>
          <View style={styles.headerBtn} />
        </View>

        {/* Floating box illustration */}
        <Animated.View style={[styles.illustrationWrapper, floatStyle]}>
          <Animated.View style={[styles.glowCircle, lightStyle]} />
          <BoxIcon boxType={box.boxType} size={100} showLockOverlay={false} />
        </Animated.View>
      </LinearGradient>

      {/* Info & CTA */}
      <Animated.View
        style={[styles.content, infoStyle, { paddingBottom: insets.bottom + Spacing[8] }]}
      >
        <View style={[styles.typeBadge, { backgroundColor: config.bgColor }]}>
          <Ionicons name={config.iconName as any} size={14} color={config.color} />
          <Text style={[styles.typeBadgeText, { color: config.color }]}>
            {config.label.toUpperCase()}
          </Text>
        </View>

        <Text style={styles.boxTitle} numberOfLines={2}>
          {box.title || config.label}
        </Text>

        <Text style={styles.createdText}>
          Được tạo vào {formatDateFull(box.createdAt)}
        </Text>

        <Text style={styles.motivationalText}>{motivationalMsg}</Text>

        {/* Open button */}
        <Animated.View style={[styles.openButtonOuter, buttonPressStyle]}>
          <TouchableOpacity
            onPress={handleOpen}
            activeOpacity={0.9}
            disabled={isOpening}
            style={styles.openButtonTouchable}
          >
            <LinearGradient
              colors={isOpening ? ['#F59E0B88', '#F9731688'] : ['#F59E0B', '#F97316']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.openButtonGradient}
            >
              <Ionicons
                name={isOpening ? 'hourglass-outline' : 'cube-outline'}
                size={22}
                color="#FFFFFF"
              />
              <Text style={styles.openButtonText}>
                {isOpening ? 'Đang mở...' : 'Mở hộp'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {phase === 'ritual' && (
        <OpeningRitualOverlay boxType={box.boxType} onFinish={goDetail} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: FontSize.xl, color: Colors.textSecondary },

  hero: {
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[8],
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
  },

  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing[4],
  },
  glowCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFF3CD',
  },

  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[5],
    gap: Spacing[3],
  },

  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: Radius.full,
  },
  typeBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.2,
  },

  boxTitle: {
    fontSize: FontSize['4xl'],
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  createdText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  motivationalText: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: FontSize.lg * 1.6,
    marginTop: Spacing[1],
  },

  openButtonOuter: {
    width: '100%',
    marginTop: Spacing[4],
    ...Shadow.fab,
    borderRadius: 28,
  },
  openButtonTouchable: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  openButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[3],
    paddingVertical: 18,
    borderRadius: 28,
  },
  openButtonText: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
