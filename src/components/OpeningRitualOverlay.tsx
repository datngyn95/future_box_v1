import React, { useCallback, useEffect, useRef } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '../constants/colors';
import { FontSize } from '../constants/typography';
import { BoxType } from '../types/box';
import { BoxIcon } from './BoxIcon';
import { hapticImpactMedium } from '../services/hapticsService';
import { playSound } from '../services/soundService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// GĐ2: mở rất chậm để gây tò mò (~3s). Có thể tap để bỏ qua.
export const OPENING_RITUAL_DURATION_MS = 3000;

const LID_DELAY_MS = 450;
const LID_DURATION_MS = 2000;

interface OpeningRitualOverlayProps {
  boxType: BoxType;
  onFinish: () => void;
}

export function OpeningRitualOverlay({ boxType, onFinish }: OpeningRitualOverlayProps) {
  const overlayOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0.22);
  const glowScale = useSharedValue(1);
  const boxScale = useSharedValue(0.96);
  const lidRotate = useSharedValue(0);
  const lidTranslateY = useSharedValue(0);
  const bloomOpacity = useSharedValue(0);
  const bloomScale = useSharedValue(0.4);
  const hintOpacity = useSharedValue(0);

  const finishedRef = useRef(false);
  const creakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish();
  }, [onFinish]);

  useEffect(() => {
    // Toàn bộ giao diện tối lại
    overlayOpacity.value = withTiming(1, { duration: 320 });

    // Hộp phát sáng MỜ (glow dịu, đập nhẹ liên tục)
    glowOpacity.value = withRepeat(withTiming(0.5, { duration: 950, easing: Easing.inOut(Easing.sin) }), -1, true);
    glowScale.value = withRepeat(withTiming(1.12, { duration: 950, easing: Easing.inOut(Easing.sin) }), -1, true);

    boxScale.value = withSequence(
      withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }),
      withDelay(1500, withTiming(1.06, { duration: 800, easing: Easing.out(Easing.cubic) })),
    );

    // Nắp hộp mở RẤT CHẬM (kẹtttt…)
    lidRotate.value = withDelay(
      LID_DELAY_MS,
      withTiming(-46, { duration: LID_DURATION_MS, easing: Easing.inOut(Easing.cubic) }),
    );
    lidTranslateY.value = withDelay(
      LID_DELAY_MS,
      withTiming(-30, { duration: LID_DURATION_MS, easing: Easing.inOut(Easing.cubic) }),
    );

    // Gợi ý "Chạm để bỏ qua" hiện mờ sau ~1s
    hintOpacity.value = withDelay(1000, withTiming(0.6, { duration: 500 }));

    // Bùng sáng dịu ở cuối → kết thúc
    bloomScale.value = withDelay(
      2250,
      withTiming(2.3, { duration: 850, easing: Easing.out(Easing.cubic) }),
    );
    bloomOpacity.value = withDelay(
      2250,
      withSequence(
        withTiming(0.62, { duration: 320 }),
        withTiming(0, { duration: 430, easing: Easing.out(Easing.quad) }, (done?: boolean) => {
          if (done) runOnJS(finish)();
        }),
      ),
    );

    // Âm thanh + haptic khi nắp bắt đầu kẹt mở
    creakTimerRef.current = setTimeout(() => {
      playSound('creak');
      void hapticImpactMedium();
    }, LID_DELAY_MS);

    return () => {
      if (creakTimerRef.current) clearTimeout(creakTimerRef.current);
    };
  }, [finish]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));
  const boxStyle = useAnimatedStyle(() => ({ transform: [{ scale: boxScale.value }] }));
  const lidStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lidTranslateY.value }, { rotate: `${lidRotate.value}deg` }],
  }));
  const bloomStyle = useAnimatedStyle(() => ({
    opacity: bloomOpacity.value,
    transform: [{ scale: bloomScale.value }],
  }));
  const hintStyle = useAnimatedStyle(() => ({ opacity: hintOpacity.value }));

  return (
    <Pressable style={styles.pressArea} onPress={finish} accessibilityRole="button">
      <Animated.View pointerEvents="none" style={[styles.overlay, overlayStyle]}>
        {/* Toàn bộ giao diện tối lại */}
        <LinearGradient colors={['#070910', '#15110A']} style={StyleSheet.absoluteFill} />

        <View style={styles.stage}>
          <Animated.View style={[styles.dimGlow, glowStyle]} />
          <Animated.View style={[styles.bloom, bloomStyle]} />

          <Animated.View style={[styles.boxWrap, boxStyle]}>
            <Animated.View style={[styles.lid, lidStyle]} />
            <BoxIcon boxType={boxType} size={112} showLockOverlay={false} />
          </Animated.View>
        </View>

        <Animated.Text style={[styles.hint, hintStyle]}>Chạm để bỏ qua</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressArea: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    width: SCREEN_WIDTH,
    height: Math.min(SCREEN_HEIGHT, 520),
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lid: {
    position: 'absolute',
    top: -8,
    width: 86,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    opacity: 0.95,
    zIndex: 2,
  },
  dimGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 221, 128, 0.35)',
  },
  bloom: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 0.9,
    borderRadius: SCREEN_WIDTH,
    backgroundColor: 'rgba(255, 244, 200, 0.9)',
  },
  hint: {
    position: 'absolute',
    bottom: 64,
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.75)',
    fontSize: FontSize.sm,
    letterSpacing: 0.5,
  },
});
