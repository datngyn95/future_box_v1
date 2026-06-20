// Lock Confirmation Modal — FutureBoxes
// Xác nhận trước khi khóa hộp, nhấn mạnh tính bất biến.
// Screen: 7. Lock Confirmation Modal (screens.md)

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { getBoxTypeConfig } from '../../src/constants/boxTypes';
import { BoxType } from '../../src/types/box';
import { createBox } from '../../src/db/boxRepository';
import { useBoxStore } from '../../src/store/boxStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

function parseTeasersParam(value?: string): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

export default function ConfirmLockScreen() {
  const {
    boxType,
    title,
    content,
    openingNote,
    reflectionQuestion,
    unlockDate,
    imagePath,
    teasers,
  } = useLocalSearchParams<{
    boxType: string;
    title: string;
    content: string;
    openingNote: string;
    reflectionQuestion: string;
    unlockDate: string;
    imagePath?: string;
    teasers?: string;
  }>();

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const config = getBoxTypeConfig(boxType as BoxType);
  const { dispatch } = useBoxStore();
  const parsedTeasers = parseTeasersParam(teasers);

  const [isLocking, setIsLocking] = useState(false);
  const [visible, setVisible] = useState(true);

  // Overlay fade-in
  const overlayOpacity = useSharedValue(0);
  // Card scale+fade in
  const cardScale = useSharedValue(0.82);
  const cardOpacity = useSharedValue(0);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  useEffect(() => {
    overlayOpacity.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.quad) });
    cardScale.value = withSpring(1, { damping: 18, stiffness: 300 });
    cardOpacity.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.quad) });
  }, []);

  const dismissModal = (callback?: () => void) => {
    overlayOpacity.value = withTiming(0, { duration: 250 });
    cardScale.value = withTiming(0.88, { duration: 250, easing: Easing.in(Easing.quad) });
    cardOpacity.value = withTiming(0, { duration: 220 });
    setTimeout(() => {
      setVisible(false);
      callback?.();
    }, 280);
  };

  const handleCancel = () => {
    if (isLocking) return;
    dismissModal(() => router.back());
  };

  const handleConfirmLock = async () => {
    if (isLocking) return;
    setIsLocking(true);

    try {
      const box = await createBox({
        boxType: boxType as BoxType,
        title: title || undefined,
        content: content ?? '',
        openingNote: openingNote || undefined,
        reflectionQuestion: reflectionQuestion || undefined,
        imagePath: imagePath || undefined,
        unlockDate: unlockDate ?? new Date().toISOString(),
        teasers: parsedTeasers,
      });

      dispatch({ type: 'ADD_BOX', payload: box });

      dismissModal(() => {
        router.replace({
          pathname: '/create-box/success',
          params: {
            boxType: box.boxType,
            title: box.title ?? '',
            unlockDate: box.unlockDate,
          },
        });
      });
    } catch (error) {
      setIsLocking(false);

      const errorMessage =
        error instanceof Error ? error.message : 'Không rõ lỗi';

      // Edge case: copy ảnh thất bại — hỏi người dùng có muốn tạo không ảnh không
      if (errorMessage === 'IMAGE_COPY_FAILED') {
        dismissModal(() => {
          Alert.alert(
            'Không lưu được ảnh',
            'Khóa hộp mà không kèm ảnh?',
            [
              { text: 'Hủy', style: 'cancel', onPress: () => {} },
              {
                text: 'Khóa không ảnh',
                onPress: async () => {
                  try {
                    const box = await createBox({
                      boxType: boxType as BoxType,
                      title: title || undefined,
                      content: content ?? '',
                      openingNote: openingNote || undefined,
                      reflectionQuestion: reflectionQuestion || undefined,
                      imagePath: undefined,
                      unlockDate: unlockDate ?? new Date().toISOString(),
                      teasers: parsedTeasers,
                    });
                    dispatch({ type: 'ADD_BOX', payload: box });
                    router.replace({
                      pathname: '/create-box/success',
                      params: {
                        boxType: box.boxType,
                        title: box.title ?? '',
                        unlockDate: box.unlockDate,
                      },
                    });
                  } catch {
                    router.back();
                    dispatch({
                      type: 'SET_ERROR',
                      payload: 'Lưu hộp thất bại. Vui lòng thử lại.',
                    });
                  }
                },
              },
            ],
          );
        });
        return;
      }

      // DB lỗi: dismiss modal, quay về form, báo lỗi
      dismissModal(() => {
        router.back();
        dispatch({
          type: 'SET_ERROR',
          payload: 'Lưu hộp thất bại. Vui lòng thử lại.',
        });
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <View style={styles.container}>
        {/* Overlay */}
        <Animated.View style={[styles.overlay, overlayStyle]} />

        {/* Modal Card */}
        <Animated.View style={[styles.cardWrapper, cardStyle]}>
          <View style={styles.card}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
              <Ionicons name="lock-closed" size={40} color={config.color} />
            </View>

            {/* Title */}
            <Text style={styles.modalTitle}>Khóa hộp này?</Text>

            {/* Warning text */}
            <Text style={styles.warningText}>
              Sau khi khóa, bạn sẽ không thể xem hay chỉnh sửa nội dung cho đến ngày mở.
            </Text>

            {/* Date line */}
            <Text style={styles.dateText}>
              Hẹn gặp lại vào{' '}
              <Text style={[styles.dateBold, { color: config.color }]}>
                {formatViDate(unlockDate ?? '')}
              </Text>
            </Text>

            {/* Confirm button */}
            <Pressable
              onPress={handleConfirmLock}
              disabled={isLocking}
              style={[
                styles.confirmButton,
                { backgroundColor: config.color },
                isLocking && styles.buttonDisabled,
              ]}
            >
              {isLocking ? (
                <ActivityIndicator color={Colors.textOnColor} size="small" />
              ) : (
                <>
                  <Ionicons
                    name="lock-closed"
                    size={18}
                    color={Colors.textOnColor}
                    style={{ marginRight: Spacing[2] }}
                  />
                  <Text style={styles.confirmButtonText}>Khóa hộp</Text>
                </>
              )}
            </Pressable>

            {/* Cancel button */}
            <Pressable
              onPress={handleCancel}
              disabled={isLocking}
              style={[styles.cancelButton, isLocking && styles.buttonDisabled]}
            >
              <Text style={styles.cancelButtonText}>Hủy bỏ</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[4],
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },

  cardWrapper: {
    width: '100%',
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing[6],
    alignItems: 'center',
    ...Shadow.lg,
  },

  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[4],
  },

  modalTitle: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing[3],
    textAlign: 'center',
  },

  warningText: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.lg * 1.55,
    marginBottom: Spacing[3],
  },

  dateText: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing[6],
  },

  dateBold: {
    fontWeight: FontWeight.bold,
    fontSize: FontSize.xl,
  },

  confirmButton: {
    width: '100%',
    height: 52,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[3],
    ...Shadow.sm,
  },
  confirmButtonText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semiBold,
    color: Colors.textOnColor,
  },

  cancelButton: {
    width: '100%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },

  buttonDisabled: {
    opacity: 0.6,
  },
});
