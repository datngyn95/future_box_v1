// FutureBoxes — Notification Service
// Xử lý local notifications dùng expo-notifications.
// AC-08.1, AC-08.2, AC-08.3, AC-08.4

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ─── Setup ────────────────────────────────────────────────────────────────────

/**
 * Cấu hình cách hiển thị notification khi app đang foreground.
 * Gọi 1 lần khi app khởi động (trước khi mount tree).
 */
export function setupNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Lắng nghe khi người dùng nhấn vào notification → deep link mở hộp.
 * Trả về subscription để caller có thể remove khi unmount.
 */
export function addNotificationResponseListener(
  onBoxOpen: (boxId: string) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const boxId = response.notification.request.content.data?.boxId as string | undefined;
    if (boxId) {
      onBoxOpen(boxId);
    }
  });
}

// ─── Permission ───────────────────────────────────────────────────────────────

/**
 * Xin quyền notification.
 * Trả về true nếu được cấp, false nếu từ chối (AC-08.3: app vẫn hoạt động).
 */
export async function requestNotificationPermission(): Promise<boolean> {
  // Android 13+ cần xin runtime permission
  if (Platform.OS === 'android') {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  // iOS
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowSound: true,
      allowBadge: false,
    },
  });
  return status === 'granted';
}

// ─── Schedule / Cancel ────────────────────────────────────────────────────────

/**
 * Lên lịch notification cho hộp tại unlockDate.
 * Nếu không có quyền hoặc unlockDate đã qua → trả về null (không throw).
 * AC-08.3: caller không cần check null, hộp vẫn tạo được.
 */
export async function scheduleBoxNotification(
  boxId: string,
  unlockDate: Date,
): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return null;

    // Không schedule nếu ngày đã qua
    if (unlockDate.getTime() <= Date.now()) return null;

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'FutureBoxes',
        body: 'Một hộp thời gian đã sẵn sàng mở! 📦',
        data: { boxId },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: unlockDate,
      },
    });

    return identifier;
  } catch {
    // Notification không phải core feature — lỗi không block tạo hộp
    return null;
  }
}

/**
 * Hủy notification đã lên lịch.
 * Dùng khi xóa hộp (AC-08.4).
 */
export async function cancelBoxNotification(
  notificationIdentifier: string,
): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationIdentifier);
  } catch {
    // Bỏ qua — notification đã bị hủy hoặc không tồn tại
  }
}
