import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { BoxType } from '../types/box';
import { BoxIcon } from './BoxIcon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const OPENING_RITUAL_DURATION_MS = 1050;

interface OpeningRitualOverlayProps {
  boxType: BoxType;
  onFinish: () => void;
}

interface SparkData {
  id: number;
  angle: number;
  distance: number;
  delay: number;
  size: number;
}

function SparkParticle({ angle, distance, delay, size }: Omit<SparkData, 'id'>) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 80 }),
        withTiming(0, { duration: 560, easing: Easing.out(Easing.quad) }),
      ),
    );
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 640, easing: Easing.out(Easing.cubic) }),
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const radians = (angle * Math.PI) / 180;
    return {
      opacity: opacity.value,
      transform: [
        { translateX: Math.cos(radians) * distance * progress.value },
        { translateY: Math.sin(radians) * distance * progress.value },
        { scale: 0.6 + progress.value * 0.8 },
      ],
    };
  });

  return <Animated.View style={[styles.spark, { width: size, height: size }, style]} />;
}

export function OpeningRitualOverlay({ boxType, onFinish }: OpeningRitualOverlayProps) {
  const overlayOpacity = useSharedValue(0);
  const boxTranslateY = useSharedValue(20);
  const boxScale = useSharedValue(0.9);
  const lidRotate = useSharedValue(0);
  const lidTranslateY = useSharedValue(0);
  const glowScale = useSharedValue(0.3);
  const glowOpacity = useSharedValue(0);
  const flashOpacity = useSharedValue(0);

  const sparks = useMemo<SparkData[]>(
    () =>
      Array.from({ length: 20 }, (_, index) => ({
        id: index,
        angle: -165 + index * 17,
        distance: 56 + (index % 5) * 14,
        delay: 360 + (index % 4) * 45,
        size: 5 + (index % 3) * 2,
      })),
    [],
  );

  useEffect(() => {
    overlayOpacity.value = withTiming(1, { duration: 160 });
    boxTranslateY.value = withSequence(
      withSpring(-18, { damping: 9, stiffness: 180 }),
      withSpring(0, { damping: 11, stiffness: 160 }),
    );
    boxScale.value = withSequence(
      withSpring(1.08, { damping: 10, stiffness: 180 }),
      withSpring(1, { damping: 12, stiffness: 170 }),
      withDelay(420, withTiming(1.16, { duration: 260, easing: Easing.out(Easing.cubic) })),
    );
    lidRotate.value = withDelay(
      380,
      withTiming(-32, { duration: 360, easing: Easing.out(Easing.cubic) }),
    );
    lidTranslateY.value = withDelay(
      380,
      withTiming(-18, { duration: 360, easing: Easing.out(Easing.cubic) }),
    );
    glowScale.value = withDelay(
      420,
      withTiming(2.1, { duration: 520, easing: Easing.out(Easing.cubic) }),
    );
    glowOpacity.value = withDelay(
      420,
      withSequence(
        withTiming(0.92, { duration: 180 }),
        withTiming(0, { duration: 560, easing: Easing.out(Easing.quad) }),
      ),
    );
    flashOpacity.value = withDelay(
      500,
      withSequence(
        withTiming(0.78, { duration: 120 }),
        withTiming(
          0,
          { duration: 420, easing: Easing.out(Easing.quad) },
          (finished?: boolean) => {
            if (finished) {
              runOnJS(onFinish)();
            }
          },
        ),
      ),
    );
  }, [onFinish]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const boxStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: boxTranslateY.value },
      { scale: boxScale.value },
    ],
  }));

  const lidStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: lidTranslateY.value },
      { rotate: `${lidRotate.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  return (
    <Animated.View pointerEvents="auto" style={[styles.overlay, overlayStyle]}>
      <LinearGradient
        colors={['#0E1220', '#231A12']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.stage}>
        <Animated.View style={[styles.glow, glowStyle]} />
        <Animated.View style={[styles.flash, flashStyle]} />

        <View style={styles.sparkLayer}>
          {sparks.map((spark) => (
            <SparkParticle
              key={spark.id}
              angle={spark.angle}
              distance={spark.distance}
              delay={spark.delay}
              size={spark.size}
            />
          ))}
        </View>

        <Animated.View style={[styles.boxWrap, boxStyle]}>
          <Animated.View style={[styles.lid, lidStyle]} />
          <BoxIcon boxType={boxType} size={112} showLockOverlay={false} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
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
  glow: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(255, 221, 128, 0.82)',
  },
  flash: {
    position: 'absolute',
    width: SCREEN_WIDTH * 1.1,
    height: SCREEN_WIDTH * 1.1,
    borderRadius: SCREEN_WIDTH,
    backgroundColor: 'rgba(255, 246, 208, 0.88)',
  },
  sparkLayer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -Spacing[3],
  },
  spark: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#FFE8A3',
  },
});
