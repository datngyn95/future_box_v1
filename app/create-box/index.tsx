// Select Box Type Screen — FutureBoxes
// Cho người dùng chọn 1 trong 4 loại hộp trước khi vào form tạo hộp.
// Screen: 5. Select Box Type Screen (screens.md)

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

import { Colors } from '../../src/constants/colors';
import { Spacing, Radius, Shadow } from '../../src/constants/spacing';
import { FontSize, FontWeight } from '../../src/constants/typography';
import { BOX_TYPE_CONFIG } from '../../src/constants/boxTypes';
import { BoxType } from '../../src/types/box';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = Spacing[3];
const CARD_WIDTH = (SCREEN_WIDTH - Spacing[4] * 2 - CARD_GAP) / 2;
const CARD_HEIGHT = 140;

// ─── Box Type Card ────────────────────────────────────────────────────────────

interface BoxTypeCardProps {
  type: BoxType;
  enterDelay: number;
  onPress: (type: BoxType) => void;
}

const BOX_TYPE_DESCRIPTIONS: Record<BoxType, string> = {
  message: 'Nhắn nhủ bản thân',
  goal: 'Đặt và theo dõi mục tiêu',
  memory: 'Lưu khoảnh khắc đáng nhớ',
  decision: 'Ghi lại quyết định quan trọng',
};

function BoxTypeCard({ type, enterDelay, onPress }: BoxTypeCardProps) {
  const config = BOX_TYPE_CONFIG[type];
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Ensure starting at initial state
    opacity.value = 0;
    translateY.value = 20;

    const timer = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
      translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.quad) });
    }, enterDelay);

    return () => clearTimeout(timer);
  }, []);

  const enterStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  return (
    <Animated.View style={[styles.cardWrapper, enterStyle]}>
      <Pressable
        onPress={() => onPress(type)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, { backgroundColor: config.color }]}
      >
        {/* Icon */}
        <View style={styles.cardIconContainer}>
          <Ionicons
            name={config.iconName as keyof typeof Ionicons.glyphMap}
            size={48}
            color={Colors.textOnColor}
          />
        </View>

        {/* Name */}
        <Text style={styles.cardName}>{config.label}</Text>

        {/* Description */}
        <Text style={styles.cardDescription} numberOfLines={1}>
          {BOX_TYPE_DESCRIPTIONS[type]}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SelectBoxTypeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const boxTypes: BoxType[] = ['message', 'goal', 'memory', 'decision'];
  const staggerDelays = [0, 75, 150, 225];

  const handleSelectType = (type: BoxType) => {
    router.push(`/create-box/${type}`);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton} hitSlop={8}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Tạo hộp mới</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* ── Content ── */}
      <View style={styles.content}>
        {/* Instruction */}
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionTitle}>Bạn muốn tạo loại hộp gì?</Text>
          <Text style={styles.instructionSubtitle}>
            Mỗi loại hộp có câu hỏi và gợi ý riêng.
          </Text>
        </View>

        {/* 2×2 Grid */}
        <View style={styles.grid}>
          {boxTypes.map((type, index) => (
            <BoxTypeCard
              key={type}
              type={type}
              enterDelay={staggerDelays[index]}
              onPress={handleSelectType}
            />
          ))}
        </View>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  headerPlaceholder: {
    width: 40,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
  },

  // Instruction
  instructionContainer: {
    marginBottom: Spacing[6],
    gap: Spacing[1],
  },
  instructionTitle: {
    fontSize: FontSize['4xl'],
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
    lineHeight: FontSize['4xl'] * 1.3,
  },
  instructionSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: FontSize.md * 1.5,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },

  // Card
  cardWrapper: {
    width: CARD_WIDTH,
  },
  card: {
    width: '100%',
    height: CARD_HEIGHT,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    justifyContent: 'flex-end',
    ...Shadow.md,
  },
  cardIconContainer: {
    position: 'absolute',
    top: Spacing[4],
    left: Spacing[4],
  },
  cardName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semiBold,
    color: Colors.textOnColor,
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: FontSize.sm,
    color: Colors.textOnColor,
    opacity: 0.85,
  },
});
