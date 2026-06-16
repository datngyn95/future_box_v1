// Create Box Form Screen — FutureBoxes
// Màn hình form đầy đủ để tạo hộp thời gian.
// Screen: 6. Create Box Form Screen (screens.md)

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  Linking,
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
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { Colors } from '../../src/constants/colors';
import { Spacing, Radius, Shadow } from '../../src/constants/spacing';
import { FontSize, FontWeight } from '../../src/constants/typography';
import { getBoxTypeConfig } from '../../src/constants/boxTypes';
import { BoxType } from '../../src/types/box';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Preset Date Options ──────────────────────────────────────────────────────

interface PresetOption {
  label: string;
  months: number;
}

const PRESET_OPTIONS: PresetOption[] = [
  { label: '1 tháng', months: 1 },
  { label: '3 tháng', months: 3 },
  { label: '6 tháng', months: 6 },
  { label: '1 năm', months: 12 },
];

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/** Ngày tối thiểu = today + 1 tháng (AC-02.1, Q3) */
function getMinDate(): Date {
  const min = new Date();
  min.setMonth(min.getMonth() + 1);
  min.setHours(0, 0, 0, 0);
  return min;
}

function formatViDate(date: Date): string {
  return date.toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ─── Animated Underline Input ─────────────────────────────────────────────────

interface AnimatedInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  maxLength: number;
  multiline?: boolean;
  minHeight?: number;
  required?: boolean;
  error?: boolean;
  accentColor: string;
  autoFocus?: boolean;
  returnKeyType?: 'next' | 'done' | 'default';
  onSubmitEditing?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputRef?: React.RefObject<any>;
}

function AnimatedInput({
  label,
  value,
  onChangeText,
  placeholder,
  maxLength,
  multiline = false,
  minHeight,
  required = false,
  error = false,
  accentColor,
  autoFocus = false,
  returnKeyType = 'next',
  onSubmitEditing,
  inputRef,
}: AnimatedInputProps) {
  const underlineColor = useSharedValue(0);
  const errorShake = useSharedValue(0);
  const counterOpacity = useSharedValue(0);

  const underlineStyle = useAnimatedStyle(() => ({
    backgroundColor: error
      ? Colors.danger
      : underlineColor.value === 1
      ? accentColor
      : Colors.borderMedium,
    height: error || underlineColor.value === 1 ? 2 : 1,
  }));

  const counterStyle = useAnimatedStyle(() => ({
    opacity: counterOpacity.value,
  }));

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: errorShake.value }],
  }));

  const handleFocus = () => {
    underlineColor.value = withTiming(1, { duration: 200 });
    counterOpacity.value = withTiming(1, { duration: 150 });
  };

  const handleBlur = () => {
    underlineColor.value = withTiming(0, { duration: 200 });
    counterOpacity.value = withTiming(0, { duration: 150 });
  };

  React.useEffect(() => {
    if (error) {
      errorShake.value = withSequence(
        withTiming(-4, { duration: 50 }),
        withRepeat(withSequence(withTiming(4, { duration: 50 }), withTiming(-4, { duration: 50 })), 3, true),
        withTiming(0, { duration: 50 }),
      );
    }
  }, [error]);

  return (
    <Animated.View style={[styles.inputSection, shakeStyle]}>
      <View style={styles.inputLabelRow}>
        <Text style={styles.inputLabel}>
          {label}
          {required && <Text style={{ color: Colors.danger }}> *</Text>}
        </Text>
        <Animated.Text style={[styles.charCounter, counterStyle]}>
          {value.length}/{maxLength}
        </Animated.Text>
      </View>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        maxLength={maxLength}
        multiline={multiline}
        autoFocus={autoFocus}
        returnKeyType={multiline ? 'default' : returnKeyType}
        onSubmitEditing={onSubmitEditing}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={[
          styles.textInput,
          multiline && styles.multilineInput,
          minHeight !== undefined && { minHeight },
        ]}
        scrollEnabled={false}
      />

      <Animated.View style={[styles.underline, underlineStyle]} />

      {error && (
        <Text style={styles.errorText}>
          {required ? `${label} là bắt buộc` : 'Vui lòng kiểm tra lại'}
        </Text>
      )}
    </Animated.View>
  );
}

// ─── Accordion Section ────────────────────────────────────────────────────────

interface AccordionSectionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  subtitle?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

function AccordionSection({
  title,
  icon,
  subtitle,
  children,
  defaultExpanded = true,
}: AccordionSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const arrowRotate = useSharedValue(defaultExpanded ? 1 : 0);
  const contentHeight = useSharedValue(defaultExpanded ? 1 : 0);
  const contentOpacity = useSharedValue(defaultExpanded ? 1 : 0);

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${arrowRotate.value * 180}deg` }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    overflow: 'hidden',
    maxHeight: contentHeight.value === 0 ? 0 : 9999,
    opacity: contentOpacity.value,
  }));

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    arrowRotate.value = withTiming(next ? 1 : 0, { duration: 250, easing: Easing.inOut(Easing.quad) });
    contentHeight.value = withTiming(next ? 1 : 0, { duration: 300, easing: Easing.inOut(Easing.quad) });
    contentOpacity.value = withTiming(next ? 1 : 0, { duration: 250 });
  };

  return (
    <View style={styles.accordionSection}>
      <Pressable onPress={toggle} style={styles.accordionHeader}>
        <View style={styles.accordionLeft}>
          <Ionicons name={icon} size={18} color={Colors.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.accordionTitle}>{title}</Text>
            {subtitle && <Text style={styles.accordionSubtitle}>{subtitle}</Text>}
          </View>
        </View>
        <Animated.View style={arrowStyle}>
          <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
        </Animated.View>
      </Pressable>
      <Animated.View style={contentStyle}>
        <View style={styles.accordionContent}>{children}</View>
      </Animated.View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CreateBoxFormScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const boxType = (type ?? 'message') as BoxType;
  const config = getBoxTypeConfig(boxType);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [openingNote, setOpeningNote] = useState('');
  const [reflectionEnabled, setReflectionEnabled] = useState(false);
  const [reflectionQuestion, setReflectionQuestion] = useState(
    config.defaultReflectionQuestion,
  );
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [unlockDate, setUnlockDate] = useState<Date | null>(null);

  // Image state
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imagePermissionDenied, setImagePermissionDenied] = useState(false);

  // Date picker state (Android cần controlled show)
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Validation errors
  const [contentError, setContentError] = useState(false);
  const [dateError, setDateError] = useState(false);

  // Refs for focus management
  const contentInputRef = useRef<TextInput>(null);

  // Reflection toggle animation
  const reflectionHeight = useSharedValue(0);
  const reflectionOpacity = useSharedValue(0);

  const reflectionStyle = useAnimatedStyle(() => ({
    overflow: 'hidden',
    maxHeight: reflectionHeight.value === 0 ? 0 : 9999,
    opacity: reflectionOpacity.value,
  }));

  // Lock button scale
  const lockBtnScale = useSharedValue(1);
  const lockBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: lockBtnScale.value }],
  }));

  // Date selected fade-in
  const dateFadeIn = useSharedValue(0);
  const dateFadeStyle = useAnimatedStyle(() => ({
    opacity: dateFadeIn.value,
    transform: [{ translateY: (1 - dateFadeIn.value) * 8 }],
  }));

  const handleReflectionToggle = (value: boolean) => {
    setReflectionEnabled(value);
    if (value) {
      reflectionHeight.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
      reflectionOpacity.value = withTiming(1, { duration: 250 });
    } else {
      reflectionHeight.value = withTiming(0, { duration: 300, easing: Easing.inOut(Easing.quad) });
      reflectionOpacity.value = withTiming(0, { duration: 200 });
    }
  };

  const handlePresetSelect = (index: number) => {
    setSelectedPreset(index);
    const date = addMonths(new Date(), PRESET_OPTIONS[index].months);
    date.setHours(0, 0, 0, 0);
    setUnlockDate(date);
    setDateError(false);
    // Reset custom picker nếu đang hiện
    setShowDatePicker(false);
    dateFadeIn.value = 0;
    dateFadeIn.value = withTiming(1, { duration: 200 });
  };

  const handleDateReset = () => {
    setSelectedPreset(null);
    setUnlockDate(null);
    setShowDatePicker(false);
    dateFadeIn.value = withTiming(0, { duration: 150 });
  };

  // ─── Image Picker (F-10) ──────────────────────────────────────────────────

  const handlePickImage = useCallback(async () => {
    setImagePermissionDenied(false);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setImagePermissionDenied(true);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  }, []);

  const handleRemoveImage = useCallback(() => {
    setImageUri(null);
  }, []);

  // ─── Date Picker (F-02) ───────────────────────────────────────────────────

  const handleCustomDatePress = () => {
    setShowDatePicker(true);
    setSelectedPreset(null);
  };

  const handleDatePickerChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    // Android: picker đóng sau chọn; iOS dùng inline nên luôn update
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (event.type === 'dismissed') return;

    if (selectedDate) {
      const minDate = getMinDate();
      if (selectedDate < minDate) {
        Alert.alert(
          'Ngày không hợp lệ',
          'Ngày mở phải tối thiểu 1 tháng kể từ hôm nay.',
        );
        return;
      }
      selectedDate.setHours(0, 0, 0, 0);
      setUnlockDate(selectedDate);
      setDateError(false);
      dateFadeIn.value = 0;
      dateFadeIn.value = withTiming(1, { duration: 200 });
    }
  };

  // ─── Form helpers ─────────────────────────────────────────────────────────

  const hasFormData = (): boolean => {
    return title.trim().length > 0 || content.trim().length > 0 || openingNote.trim().length > 0;
  };

  const handleBack = () => {
    if (hasFormData()) {
      Alert.alert(
        'Hủy tạo hộp?',
        'Nội dung chưa lưu sẽ bị mất.',
        [
          { text: 'Tiếp tục viết', style: 'cancel' },
          { text: 'Hủy bỏ', style: 'destructive', onPress: () => router.back() },
        ],
      );
    } else {
      router.back();
    }
  };

  const validate = (): boolean => {
    let valid = true;
    if (content.trim().length === 0) {
      setContentError(true);
      valid = false;
    } else {
      setContentError(false);
    }
    if (!unlockDate) {
      setDateError(true);
      valid = false;
    } else {
      setDateError(false);
    }
    return valid;
  };

  const handleLockPress = () => {
    lockBtnScale.value = withSequence(
      withSpring(0.94, { damping: 12, stiffness: 400 }),
      withSpring(1, { damping: 12, stiffness: 300 }),
    );

    if (!validate()) {
      if (content.trim().length === 0) {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }
      return;
    }

    router.push({
      pathname: '/create-box/confirm-lock',
      params: {
        boxType,
        title: title.trim(),
        content: content.trim(),
        openingNote: openingNote.trim(),
        reflectionQuestion: reflectionEnabled ? reflectionQuestion.trim() : '',
        unlockDate: unlockDate!.toISOString(),
        imagePath: imageUri ?? '',
      },
    });
  };

  const headerTint = config.bgColor;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing[2], backgroundColor: headerTint }]}>
          <Pressable onPress={handleBack} style={styles.backButton} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={config.color} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Ionicons name={config.iconName as keyof typeof Ionicons.glyphMap} size={16} color={config.color} />
            <Text style={[styles.headerTitle, { color: config.color }]}>
              Hộp {config.label}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* ── Scrollable Form ── */}
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 96 + Spacing[4] },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title field */}
          <AnimatedInput
            label="TIÊU ĐỀ"
            value={title}
            onChangeText={setTitle}
            placeholder="Tiêu đề hộp (tùy chọn)"
            maxLength={80}
            accentColor={config.color}
            returnKeyType="next"
            onSubmitEditing={() => contentInputRef.current?.focus()}
          />

          {/* Content field */}
          <AnimatedInput
            inputRef={contentInputRef}
            label="NỘI DUNG"
            value={content}
            onChangeText={(t) => {
              setContent(t);
              if (contentError && t.trim().length > 0) setContentError(false);
            }}
            placeholder={config.contentPlaceholder}
            maxLength={2000}
            multiline
            minHeight={120}
            required
            error={contentError}
            accentColor={config.color}
            returnKeyType="default"
          />

          {/* Opening Note — Accordion */}
          <AccordionSection
            title="LỜI NHẮN KHI MỞ"
            icon="mail-outline"
            subtitle="Điều bạn muốn nói với mình lúc mở hộp"
          >
            <TextInput
              value={openingNote}
              onChangeText={setOpeningNote}
              placeholder="Ví dụ: Chào bạn! Mình hy vọng bạn..."
              placeholderTextColor={Colors.textMuted}
              maxLength={500}
              multiline
              style={[styles.textInput, styles.multilineInput, { minHeight: 72 }]}
              scrollEnabled={false}
            />
          </AccordionSection>

          {/* Reflection Question Toggle */}
          <View style={styles.toggleRow}>
            <Ionicons name="help-circle-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.toggleLabel}>Thêm câu hỏi phản hồi</Text>
            <Switch
              value={reflectionEnabled}
              onValueChange={handleReflectionToggle}
              trackColor={{ false: Colors.borderMedium, true: config.color }}
              thumbColor={Colors.textOnColor}
            />
          </View>

          {/* Reflection Question Input */}
          <Animated.View style={reflectionStyle}>
            <View style={styles.reflectionInputContainer}>
              <TextInput
                value={reflectionQuestion}
                onChangeText={setReflectionQuestion}
                placeholder={
                  boxType === 'memory'
                    ? 'Nhập câu hỏi của bạn'
                    : config.defaultReflectionQuestion || 'Nhập câu hỏi của bạn'
                }
                placeholderTextColor={Colors.textMuted}
                maxLength={200}
                style={[styles.textInput, { paddingTop: Spacing[2] }]}
              />
              <Text style={styles.reflectionHint}>Câu trả lời dạng Có / Không</Text>
            </View>
          </Animated.View>

          {/* Photo Attachment (F-10) */}
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionLabel}>ĐẶT ẢNH KÈM (tùy chọn)</Text>

          {/* Permission denied banner */}
          {imagePermissionDenied && (
            <View style={styles.permissionBanner}>
              <Ionicons name="warning-outline" size={16} color={Colors.warningText} />
              <Text style={styles.permissionBannerText}>
                Cần quyền truy cập thư viện ảnh
              </Text>
              <Pressable
                onPress={() => Linking.openSettings()}
                style={styles.permissionSettingsBtn}
              >
                <Text style={styles.permissionSettingsBtnText}>Mở Cài đặt</Text>
              </Pressable>
            </View>
          )}

          {imageUri ? (
            /* Preview ảnh đã chọn */
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
              <Pressable
                onPress={handleRemoveImage}
                style={styles.removeImageBtn}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={24} color={Colors.danger} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={styles.photoPlaceholder}
              onPress={handlePickImage}
            >
              <Ionicons name="camera-outline" size={28} color={Colors.textMuted} />
              <Text style={styles.photoPlaceholderText}>Thêm ảnh</Text>
            </Pressable>
          )}

          {/* Date Picker Section */}
          <View style={styles.sectionDivider} />
          <View style={styles.dateSectionHeader}>
            <Text style={styles.sectionLabel}>
              NGÀY MỞ <Text style={{ color: Colors.danger }}>*</Text>
            </Text>
          </View>

          {/* Preset chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsContainer}
          >
            {PRESET_OPTIONS.map((opt, idx) => {
              const selected = selectedPreset === idx;
              return (
                <Pressable
                  key={idx}
                  onPress={() => handlePresetSelect(idx)}
                  style={[
                    styles.presetChip,
                    selected && { backgroundColor: config.color, borderColor: config.color },
                  ]}
                >
                  {selected && (
                    <Ionicons name="checkmark" size={14} color={Colors.textOnColor} style={{ marginRight: 2 }} />
                  )}
                  <Text style={[styles.presetChipText, selected && { color: Colors.textOnColor }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              style={[
                styles.presetChip,
                selectedPreset === null && unlockDate !== null && {
                  backgroundColor: config.color,
                  borderColor: config.color,
                },
              ]}
              onPress={handleCustomDatePress}
            >
              <Ionicons
                name="calendar-outline"
                size={14}
                color={selectedPreset === null && unlockDate !== null ? Colors.textOnColor : Colors.textSecondary}
                style={{ marginRight: 4 }}
              />
              <Text style={[
                styles.presetChipText,
                selectedPreset === null && unlockDate !== null && { color: Colors.textOnColor },
              ]}>
                Tùy chỉnh
              </Text>
            </Pressable>
          </ScrollView>

          {/* Native Date Picker — iOS inline / Android modal */}
          {showDatePicker && (
            <DateTimePicker
              value={unlockDate ?? getMinDate()}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              minimumDate={getMinDate()}
              onChange={handleDatePickerChange}
              locale="vi"
              accentColor={config.color}
            />
          )}

          {/* Selected date display */}
          {unlockDate && (
            <Animated.View style={[styles.selectedDateRow, dateFadeStyle]}>
              <Text style={styles.selectedDateText}>
                Sẽ mở vào{' '}
                <Text style={[styles.selectedDateBold, { color: config.color }]}>
                  {formatViDate(unlockDate)}
                </Text>
              </Text>
              <Pressable onPress={handleDateReset} hitSlop={8}>
                <Text style={[styles.changeDateText, { color: config.color }]}>Đổi</Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Date error */}
          {dateError && (
            <Text style={styles.errorText}>Vui lòng chọn ngày mở</Text>
          )}
        </ScrollView>

        {/* ── Sticky Lock Button ── */}
        <View
          style={[
            styles.stickyButtonContainer,
            {
              paddingBottom: insets.bottom + Spacing[3],
              backgroundColor: Colors.background,
            },
          ]}
        >
          <View style={styles.stickyGradientSeparator} />

          <Animated.View style={lockBtnStyle}>
            <Pressable
              onPress={handleLockPress}
              style={[styles.lockButton, { backgroundColor: config.color }]}
            >
              <Ionicons name="lock-closed" size={20} color={Colors.textOnColor} style={{ marginRight: Spacing[2] }} />
              <Text style={styles.lockButtonText}>Khóa hộp</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[3],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semiBold,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
  },

  // Input section
  inputSection: {
    marginBottom: Spacing[5],
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  inputLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  charCounter: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  textInput: {
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    paddingVertical: Spacing[2],
    minHeight: 44,
  },
  multilineInput: {
    textAlignVertical: 'top',
    lineHeight: FontSize.xl * 1.6,
  },
  underline: {
    height: 1,
    backgroundColor: Colors.borderMedium,
    marginTop: 2,
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.danger,
    marginTop: Spacing[1],
  },

  // Accordion
  accordionSection: {
    marginBottom: Spacing[5],
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  accordionLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[2],
    flex: 1,
  },
  accordionTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  accordionSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  accordionContent: {
    paddingTop: Spacing[3],
  },

  // Toggle row
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginBottom: Spacing[2],
  },
  toggleLabel: {
    flex: 1,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },

  // Reflection input
  reflectionInputContainer: {
    marginBottom: Spacing[4],
  },
  reflectionHint: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing[1],
  },

  // Section divider
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginBottom: Spacing[4],
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: Spacing[3],
  },

  // Permission denied banner
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.warningBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    marginBottom: Spacing[3],
  },
  permissionBannerText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.warningText,
  },
  permissionSettingsBtn: {
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
  },
  permissionSettingsBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.warningText,
    textDecorationLine: 'underline',
  },

  // Photo
  photoPlaceholder: {
    height: 80,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.borderMedium,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[1],
    marginBottom: Spacing[5],
  },
  photoPlaceholderText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  imagePreviewContainer: {
    marginBottom: Spacing[5],
    borderRadius: Radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: Radius.md,
  },
  removeImageBtn: {
    position: 'absolute',
    top: Spacing[2],
    right: Spacing[2],
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
  },

  // Date section
  dateSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  presetsContainer: {
    gap: Spacing[2],
    paddingVertical: Spacing[1],
    paddingBottom: Spacing[3],
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.borderMedium,
    backgroundColor: Colors.surface,
  },
  presetChipText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  selectedDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3],
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.md,
    marginTop: Spacing[1],
    marginBottom: Spacing[2],
  },
  selectedDateText: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
  },
  selectedDateBold: {
    fontWeight: FontWeight.bold,
    fontSize: FontSize.lg,
  },
  changeDateText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
  },

  // Sticky lock button
  stickyButtonContainer: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  stickyGradientSeparator: {
    height: 1,
    marginBottom: Spacing[3],
  },
  lockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: Radius.lg,
    ...Shadow.md,
  },
  lockButtonText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semiBold,
    color: Colors.textOnColor,
  },
});
