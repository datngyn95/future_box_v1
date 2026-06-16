// AppLockScreen — màn hình khóa ứng dụng (F-18)
// Render như overlay, không phải route — hiện khi app lock bật

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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  withDelay,
  Easing,
} from 'react-native-reanimated';

import { Colors } from '../constants/colors';
import { Spacing, Radius } from '../constants/spacing';
import { FontSize, FontWeight } from '../constants/typography';
import {
  verifyPIN,
  isBiometricAvailable,
  authenticateWithBiometric,
} from '../services/authService';
import { isBiometricEnabled } from '../services/settingsService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PIN_LENGTH = 4;
const PAD_KEYS = ['1','2','3','4','5','6','7','8','9','*','0','⌫'] as const;

interface Props {
  onUnlocked: () => void;
}

// ─── PIN Dot ─────────────────────────────────────────────────────────────────

function PinDot({ filled }: { filled: boolean }) {
  const scale = useSharedValue(filled ? 1 : 0.7);
  const bg = filled ? Colors.primary : Colors.borderMedium;

  useEffect(() => {
    scale.value = withSpring(filled ? 1 : 0.7, { damping: 15, stiffness: 300 });
  }, [filled]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: bg,
  }));

  return <Animated.View style={[styles.pinDot, style]} />;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function AppLockScreen({ onUnlocked }: Props) {
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showBiometric, setShowBiometric] = useState(false);

  const dotsShakeX = useSharedValue(0);
  const errorOpacity = useSharedValue(0);
  const screenOpacity = useSharedValue(0);

  useEffect(() => {
    screenOpacity.value = withTiming(1, { duration: 300 });
    checkBiometric();
  }, []);

  const checkBiometric = useCallback(async () => {
    const available = await isBiometricAvailable();
    const enabled = await isBiometricEnabled();
    if (available && enabled) {
      setShowBiometric(true);
      triggerBiometric();
    }
  }, []);

  const triggerBiometric = useCallback(async () => {
    const success = await authenticateWithBiometric();
    if (success) onUnlocked();
  }, [onUnlocked]);

  const shakeAndClear = useCallback(() => {
    dotsShakeX.value = withSequence(
      withTiming(-10, { duration: 60 }),
      withRepeat(withSequence(
        withTiming(10, { duration: 60 }),
        withTiming(-10, { duration: 60 }),
      ), 3, false),
      withTiming(0, { duration: 60 }),
    );
    errorOpacity.value = withTiming(1, { duration: 150 });
    setTimeout(() => {
      errorOpacity.value = withTiming(0, { duration: 300 });
    }, 2000);
    setTimeout(() => setPin(''), 400);
  }, []);

  const handleKey = useCallback(async (key: string) => {
    if (key === '⌫') {
      setPin((p) => p.slice(0, -1));
      setErrorMsg('');
      return;
    }
    if (key === '*') return; // unused

    const newPin = pin + key;
    setPin(newPin);
    setErrorMsg('');

    if (newPin.length === PIN_LENGTH) {
      const valid = await verifyPIN(newPin);
      if (valid) {
        onUnlocked();
      } else {
        setErrorMsg('PIN không đúng, vui lòng thử lại.');
        shakeAndClear();
      }
    }
  }, [pin, onUnlocked, shakeAndClear]);

  const screenStyle = useAnimatedStyle(() => ({ opacity: screenOpacity.value }));
  const dotsStyle = useAnimatedStyle(() => ({ transform: [{ translateX: dotsShakeX.value }] }));
  const errorStyle = useAnimatedStyle(() => ({ opacity: errorOpacity.value }));

  return (
    <Animated.View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }, screenStyle]}>
      {/* Logo */}
      <View style={styles.logoSection}>
        <View style={styles.logoCircle}>
          <Ionicons name="cube" size={36} color={Colors.primary} />
        </View>
        <Text style={styles.appName}>FutureBoxes</Text>
        <Text style={styles.appTagline}>Hộp thời gian của bạn</Text>
      </View>

      {/* Label */}
      <Text style={styles.instructionText}>
        {showBiometric ? 'Nhập PIN hoặc dùng biometric' : 'Nhập PIN để mở khóa'}
      </Text>

      {/* PIN dots */}
      <Animated.View style={[styles.pinDotsRow, dotsStyle]}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <PinDot key={i} filled={i < pin.length} />
        ))}
      </Animated.View>

      {/* Error */}
      <Animated.Text style={[styles.errorText, errorStyle]}>
        {errorMsg}
      </Animated.Text>

      {/* Biometric retry */}
      {showBiometric && (
        <TouchableOpacity onPress={triggerBiometric} style={styles.biometricBtn} activeOpacity={0.7}>
          <Ionicons name="finger-print" size={24} color={Colors.primary} />
          <Text style={styles.biometricText}>Dùng biometric</Text>
        </TouchableOpacity>
      )}

      {/* Numpad */}
      <View style={styles.numpad}>
        {PAD_KEYS.map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.numKey, key === '*' && styles.numKeyHidden]}
            onPress={() => key !== '*' && handleKey(key)}
            activeOpacity={key === '*' ? 1 : 0.6}
            disabled={key === '*'}
          >
            {key === '⌫' ? (
              <Ionicons name="backspace-outline" size={24} color={Colors.textPrimary} />
            ) : key !== '*' ? (
              <Text style={styles.numKeyText}>{key}</Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[4],
    zIndex: 9999,
  },
  logoSection: {
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[4],
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: FontSize['4xl'],
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  appTagline: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
  },
  instructionText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  pinDotsRow: {
    flexDirection: 'row',
    gap: Spacing[4],
    marginVertical: Spacing[2],
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  errorText: {
    fontSize: FontSize.md,
    color: Colors.danger,
    textAlign: 'center',
    height: 20,
  },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
  },
  biometricText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: SCREEN_WIDTH * 0.72,
    marginTop: Spacing[4],
  },
  numKey: {
    width: (SCREEN_WIDTH * 0.72) / 3,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numKeyHidden: {
    opacity: 0,
  },
  numKeyText: {
    fontSize: FontSize['4xl'],
    fontWeight: FontWeight.regular,
    color: Colors.textPrimary,
  },
});
