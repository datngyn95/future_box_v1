// GĐ3: Lớp sương che nội dung sau khi mở hộp.
// Người dùng VUỐT để "lau sương" — vuốt càng nhiều, sương tan càng nhiều cho tới
// khi lộ nội dung. Sương gồm nhiều lớp tan ở tốc độ khác nhau: lớp dày tan trước,
// vài dải sương mỏng còn vương lại trôi ngang qua nội dung (đỉnh núi ẩn hiện trong
// sương). Phía sau sương có bóng mờ của chiếc hộp. Có nút "Hiện luôn".
// Âm nền: gió rít nhẹ (loop) do màn detail làm chủ.

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
  interpolate,
  Extrapolation,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Tổng quãng đường vuốt (px) cần để lau sạch sương.
const ACC_THRESHOLD = 1500;

interface FogRevealOverlayProps {
  boxType: BoxType;
  onRevealed: () => void;
}

export function FogRevealOverlay({ boxType, onRevealed }: FogRevealOverlayProps) {
  // target: tiến độ "thô" cập nhật trực tiếp theo ngón tay (0 = đầy sương, 1 = sạch).
  // progress: bám theo target có độ trễ → vuốt mượt, không giật cục.
  const target = useSharedValue(0);
  const progress = useDerivedValue(() =>
    withTiming(target.value, { duration: 260, easing: Easing.out(Easing.cubic) }),
  );

  // Các lớp sương trôi ở tốc độ/nhịp khác nhau + nhịp "thở" cho sống động.
  const drift1 = useSharedValue(0);
  const drift2 = useSharedValue(0);
  const drift3 = useSharedValue(0);
  const breathe = useSharedValue(0);

  const finishedRef = useRef(false);
  const completingRef = useRef(false);
  const accRef = useRef(0);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const reveal = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    // Tiếng gió do màn detail làm chủ — KHÔNG tắt ở đây để âm nền liền mạch.
    void hapticSuccess();
    onRevealed();
  };

  const completeReveal = () => {
    if (completingRef.current) return;
    completingRef.current = true;
    target.value = 1;
  };

  const bump = (amount: number) => {
    if (completingRef.current) return;
    accRef.current += amount;
    target.value = Math.min(1, accRef.current / ACC_THRESHOLD);
    if (accRef.current >= ACC_THRESHOLD) {
      completeReveal();
    }
  };

  // Sương tan hết → lộ nội dung. Bắt khi progress thực sự gần 1 để khớp animation.
  useAnimatedReaction(
    () => progress.value,
    (v) => {
      if (v >= 0.99) runOnJS(reveal)();
    },
  );

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
    // Sương trôi ngang qua lại ở các tốc độ lệch nhau cho tự nhiên.
    drift1.value = withRepeat(withTiming(1, { duration: 8200, easing: Easing.inOut(Easing.sin) }), -1, true);
    drift2.value = withRepeat(withTiming(1, { duration: 11000, easing: Easing.inOut(Easing.sin) }), -1, true);
    drift3.value = withRepeat(withTiming(1, { duration: 6200, easing: Easing.inOut(Easing.sin) }), -1, true);
    breathe.value = withRepeat(withTiming(1, { duration: 5200, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);

  // --- Các lớp sương: tan ở khoảng progress khác nhau để tạo chiều sâu ---

  // Lớp blur nền (frosted) — tan sớm-vừa.
  const blurLayerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.7], [1, 0], Extrapolation.CLAMP),
  }));

  // Lớp sương DÀY (nền) — tan sớm nhất, kèm thở nhẹ + trôi chậm.
  const denseFogStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5], [0.92, 0], Extrapolation.CLAMP),
    transform: [
      { translateX: -50 + drift1.value * 100 },
      { translateY: breathe.value * 14 },
      { scale: 1.08 + breathe.value * 0.06 },
    ],
  }));

  // Lớp sương GIỮA — tan ở giữa, trôi ngược chiều.
  const midFogStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.08, 0.82], [0.7, 0], Extrapolation.CLAMP),
    transform: [
      { translateX: 55 - drift2.value * 110 },
      { translateY: -breathe.value * 10 },
      { scale: 1.1 - breathe.value * 0.05 },
    ],
  }));

  // Dải sương MỎNG phía trên — vương lại lâu, trôi nhanh (đỉnh núi ẩn hiện).
  const wispTopStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.3, 1], [0.62, 0], Extrapolation.CLAMP),
    transform: [
      { translateX: -70 + drift3.value * 140 },
      { translateY: breathe.value * 8 },
    ],
  }));

  // Dải sương MỎNG phía dưới — vương lại lâu nhất, trôi ngược.
  const wispBottomStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.42, 1], [0.58, 0], Extrapolation.CLAMP),
    transform: [
      { translateX: 80 - drift1.value * 150 },
      { translateY: -breathe.value * 9 },
    ],
  }));

  // Bóng hộp phía sau — mờ dần khi nội dung thật lộ ra.
  const silhouetteStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.72], [0.5, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.06], Extrapolation.CLAMP) }],
  }));

  const hintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5], [0.9, 0], Extrapolation.CLAMP),
  }));

  return (
    <View style={styles.root} {...panResponder.panHandlers}>
      {/* Blur nền */}
      <Animated.View style={[StyleSheet.absoluteFill, blurLayerStyle]}>
        <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* Lớp sương dày (nền) */}
      <Animated.View style={[StyleSheet.absoluteFill, denseFogStyle]}>
        <LinearGradient
          colors={['rgba(214,218,228,0.85)', 'rgba(184,190,204,0.72)', 'rgba(158,164,180,0.85)']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Lớp sương giữa (chéo, trôi ngược) */}
      <Animated.View style={[StyleSheet.absoluteFill, midFogStyle]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.55)', 'rgba(206,211,222,0.22)', 'rgba(255,255,255,0.5)']}
          start={{ x: 0, y: 0.2 }}
          end={{ x: 1, y: 0.9 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Dải sương mỏng phía trên */}
      <Animated.View style={[styles.wispTop, wispTopStyle]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.25)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Dải sương mỏng phía dưới */}
      <Animated.View style={[styles.wispBottom, wispBottomStyle]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.28)', 'rgba(255,255,255,0.72)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
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
    </View>
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
  wispTop: {
    position: 'absolute',
    top: -SCREEN_HEIGHT * 0.05,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.45,
  },
  wispBottom: {
    position: 'absolute',
    bottom: -SCREEN_HEIGHT * 0.05,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.5,
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
