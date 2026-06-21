// GĐ3: Lớp sương che nội dung sau khi mở hộp.
// Người dùng VUỐT để "lau sương" — vuốt càng nhiều, sương tan càng nhiều cho tới
// khi lộ nội dung. Phía sau sương có bóng mờ của chiếc hộp. Có nút "Hiện luôn".
// Âm nền: gió rít nhẹ (loop), thỉnh thoảng kèm chuông nhỏ (no-op khi chưa có file).

import React, { useEffect, useMemo, useRef } from 'react';
import {
  Dimensions,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '../constants/colors';
import { Spacing, Radius } from '../constants/spacing';
import { FontSize, FontWeight } from '../constants/typography';
import { BoxType } from '../types/box';
import { BoxIcon } from './BoxIcon';
import { hapticImpactLight, hapticSuccess } from '../services/hapticsService';
import { playSound } from '../services/soundService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Tổng quãng đường vuốt (px) cần để lau sạch sương.
const ACC_THRESHOLD = 1500;

interface FogRevealOverlayProps {
  boxType: BoxType;
  onRevealed: () => void;
}

export function FogRevealOverlay({ boxType, onRevealed }: FogRevealOverlayProps) {
  const progress = useSharedValue(0); // 0 = đầy sương, 1 = sạch
  const drift1 = useSharedValue(0);
  const drift2 = useSharedValue(0);

  const finishedRef = useRef(false);
  const completingRef = useRef(false);
  const accRef = useRef(0);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const bellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reveal = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    // Tiếng gió do màn detail làm chủ — KHÔNG tắt ở đây để âm nền liền mạch.
    if (bellTimerRef.current) clearTimeout(bellTimerRef.current);
    void hapticSuccess();
    onRevealed();
  };

  const completeReveal = () => {
    if (completingRef.current) return;
    completingRef.current = true;
    progress.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.quad) }, (done) => {
      if (done) runOnJS(reveal)();
    });
  };

  const bump = (amount: number) => {
    if (completingRef.current) return;
    accRef.current += amount;
    const p = Math.min(0.97, accRef.current / ACC_THRESHOLD);
    progress.value = p;
    if (accRef.current >= ACC_THRESHOLD) {
      completeReveal();
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          lastPointRef.current = {
            x: evt.nativeEvent.locationX,
            y: evt.nativeEvent.locationY,
          };
          void hapticImpactLight();
        },
        onPanResponderMove: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const last = lastPointRef.current;
          if (last) {
            const dx = locationX - last.x;
            const dy = locationY - last.y;
            bump(Math.sqrt(dx * dx + dy * dy));
          }
          lastPointRef.current = { x: locationX, y: locationY };
        },
        onPanResponderRelease: () => {
          lastPointRef.current = null;
        },
        onPanResponderTerminate: () => {
          lastPointRef.current = null;
        },
      }),
    [],
  );

  useEffect(() => {
    // Sương trôi nhẹ qua lại
    drift1.value = withRepeat(withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.sin) }), -1, true);
    drift2.value = withRepeat(withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.sin) }), -1, true);

    // Chuông nhỏ thỉnh thoảng (gió rít do màn detail làm chủ)
    const scheduleBell = () => {
      bellTimerRef.current = setTimeout(() => {
        if (finishedRef.current) return;
        playSound('bell', { volume: 0.6 });
        scheduleBell();
      }, 3500 + Math.random() * 4000);
    };
    scheduleBell();

    return () => {
      if (bellTimerRef.current) clearTimeout(bellTimerRef.current);
    };
  }, []);

  // Sương tan dần theo progress
  const fogStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));
  const silhouetteStyle = useAnimatedStyle(() => ({
    // bóng hộp rõ hơn một chút giữa chừng rồi mờ đi khi sắp lộ nội dung
    opacity: (1 - progress.value) * 0.5,
  }));
  const drift1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: -40 + drift1.value * 80 }],
  }));
  const drift2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: 40 - drift2.value * 80 }],
  }));
  const hintStyle = useAnimatedStyle(() => ({ opacity: (1 - progress.value) * 0.85 }));

  return (
    <Animated.View style={[styles.root, fogStyle]} {...panResponder.panHandlers}>
      <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />

      {/* Lớp sương màu + chuyển động trôi */}
      <Animated.View style={[StyleSheet.absoluteFill, drift1Style]}>
        <LinearGradient
          colors={['rgba(210,214,224,0.78)', 'rgba(180,186,200,0.62)', 'rgba(150,156,172,0.78)']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, drift2Style]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.18)', 'rgba(200,205,216,0.10)', 'rgba(255,255,255,0.18)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Bóng mờ chiếc hộp phía sau sương */}
      <View style={styles.center} pointerEvents="none">
        <Animated.View style={silhouetteStyle}>
          <BoxIcon boxType={boxType} size={140} showLockOverlay={false} />
        </Animated.View>
      </View>

      {/* Gợi ý + nút Hiện luôn */}
      <View style={styles.hintWrap} pointerEvents="box-none">
        <Animated.Text style={[styles.hintText, hintStyle]}>
          Vuốt để lau lớp sương…
        </Animated.Text>
        <Pressable
          style={styles.revealBtn}
          onPress={completeReveal}
          accessibilityRole="button"
        >
          <Text style={styles.revealBtnText}>Hiện luôn</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 50,
    overflow: 'hidden',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintWrap: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: Spacing[4],
  },
  hintText: {
    color: 'rgba(40,44,56,0.9)',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semiBold,
    letterSpacing: 0.3,
  },
  revealBtn: {
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  revealBtnText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
  },
});
