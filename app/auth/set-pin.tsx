// Set PIN Screen — đặt mã PIN lần đầu hoặc đổi PIN (F-18)
// Params: mode = 'set' | 'change'

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '../../src/constants/colors';
import { Spacing, Radius } from '../../src/constants/spacing';
import { FontSize, FontWeight } from '../../src/constants/typography';
import { setPIN, verifyPIN } from '../../src/services/authService';
import { isBiometricAvailable } from '../../src/services/authService';
import { setBiometricEnabled, setAppLockEnabled } from '../../src/services/settingsService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PIN_LENGTH = 4;
const PAD_KEYS = ['1','2','3','4','5','6','7','8','9','*','0','⌫'] as const;

type Step = 'enter' | 'confirm' | 'biometric';

function PinDot({ filled }: { filled: boolean }) {
  const scale = useSharedValue(0.7);

  useEffect(() => {
    scale.value = withSpring(filled ? 1 : 0.7, { damping: 15, stiffness: 300 });
  }, [filled]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: filled ? Colors.primary : Colors.borderMedium,
  }));

  return <Animated.View style={[styles.pinDot, style]} />;
}

export default function SetPinScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();

  const [step, setStep] = useState<Step>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const dotsShakeX = useSharedValue(0);
  const errorOpacity = useSharedValue(0);

  useEffect(() => {
    isBiometricAvailable().then(setBiometricAvailable);
  }, []);

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
    setTimeout(() => setCurrentPin(''), 400);
  }, []);

  const handleKey = useCallback(async (key: string) => {
    if (key === '⌫') {
      setCurrentPin((p) => p.slice(0, -1));
      setErrorMsg('');
      return;
    }

    const newPin = currentPin + key;
    setCurrentPin(newPin);
    setErrorMsg('');

    if (newPin.length < PIN_LENGTH) return;

    if (step === 'enter') {
      setFirstPin(newPin);
      setCurrentPin('');
      setStep('confirm');
    } else if (step === 'confirm') {
      if (newPin === firstPin) {
        await setPIN(newPin);
        await setAppLockEnabled(true);
        if (biometricAvailable) {
          setCurrentPin('');
          setStep('biometric');
        } else {
          router.back();
        }
      } else {
        setErrorMsg('Mã PIN không khớp. Vui lòng thử lại.');
        shakeAndClear();
        setFirstPin('');
        setStep('enter');
      }
    }
  }, [currentPin, step, firstPin, biometricAvailable, shakeAndClear, router]);

  const handleEnableBiometric = useCallback(async () => {
    await setBiometricEnabled(true);
    router.back();
  }, [router]);

  const dotsStyle = useAnimatedStyle(() => ({ transform: [{ translateX: dotsShakeX.value }] }));
  const errorStyle = useAnimatedStyle(() => ({ opacity: errorOpacity.value }));

  const stepTitles: Record<Step, string> = {
    enter: mode === 'change' ? 'Nhập mã PIN mới' : 'Tạo mã PIN của bạn',
    confirm: 'Nhập lại để xác nhận',
    biometric: 'Bật biometric?',
  };

  if (step === 'biometric') {
    return (
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + Spacing[6] }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.biometricSection}>
          <Ionicons name="finger-print" size={64} color={Colors.primary} />
          <Text style={styles.biometricTitle}>Dùng Face ID / Vân tay?</Text>
          <Text style={styles.biometricDesc}>
            Mở khóa nhanh hơn bằng sinh trắc học thay vì nhập PIN mỗi lần.
          </Text>
          <TouchableOpacity
            style={styles.biometricEnableBtn}
            onPress={handleEnableBiometric}
            activeOpacity={0.85}
          >
            <Text style={styles.biometricEnableText}>Bật biometric</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={styles.skipBiometricBtn}>
            <Text style={styles.skipBiometricText}>Không, chỉ dùng PIN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + Spacing[6] }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode === 'change' ? 'Đổi PIN' : 'Đặt PIN'}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {/* Step indicator */}
      <View style={styles.stepRow}>
        <View style={[styles.stepDot, step === 'enter' && styles.stepDotActive]} />
        <View style={[styles.stepDot, step === 'confirm' && styles.stepDotActive]} />
      </View>

      {/* Title */}
      <Text style={styles.stepTitle}>{stepTitles[step]}</Text>

      {/* PIN dots */}
      <Animated.View style={[styles.pinDotsRow, dotsStyle]}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <PinDot key={i} filled={i < currentPin.length} />
        ))}
      </Animated.View>
      <Text style={styles.pinHint}>Chọn 4 chữ số</Text>

      {/* Error */}
      <Animated.Text style={[styles.errorText, errorStyle]}>
        {errorMsg}
      </Animated.Text>

      {/* Warning */}
      {step === 'enter' && (
        <View style={styles.warningBox}>
          <Ionicons name="warning-outline" size={16} color={Colors.warningText} />
          <Text style={styles.warningText}>
            Lưu ý: Nếu quên PIN, bạn sẽ cần gỡ cài đặt lại ứng dụng và mất toàn bộ dữ liệu.
          </Text>
        </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  backBtn: {
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

  stepRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginTop: Spacing[6],
    marginBottom: Spacing[4],
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.borderMedium,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
    width: 24,
    borderRadius: 4,
  },

  stepTitle: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing[6],
  },

  pinDotsRow: {
    flexDirection: 'row',
    gap: Spacing[5],
    marginBottom: Spacing[2],
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  pinHint: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing[2],
  },

  errorText: {
    fontSize: FontSize.md,
    color: Colors.danger,
    textAlign: 'center',
    height: 20,
    marginBottom: Spacing[2],
  },

  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[2],
    backgroundColor: Colors.warningBg,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderRadius: Radius.md,
    marginHorizontal: Spacing[6],
    marginBottom: Spacing[4],
  },
  warningText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.warningText,
    lineHeight: FontSize.sm * 1.5,
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
  numKeyHidden: { opacity: 0 },
  numKeyText: {
    fontSize: FontSize['4xl'],
    fontWeight: FontWeight.regular,
    color: Colors.textPrimary,
  },

  // Biometric step
  biometricSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[8],
    gap: Spacing[4],
  },
  biometricTitle: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  biometricDesc: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.lg * 1.6,
  },
  biometricEnableBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing[8],
    paddingVertical: Spacing[4],
    borderRadius: Radius.full,
    width: '100%',
    alignItems: 'center',
  },
  biometricEnableText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semiBold,
    color: Colors.textOnColor,
  },
  skipBiometricBtn: { paddingVertical: Spacing[3] },
  skipBiometricText: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
