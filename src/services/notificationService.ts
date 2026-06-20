// FutureBoxes — Notification Service
// Xử lý local notifications dùng expo-notifications.
// AC-08.1, AC-08.2, AC-08.3, AC-08.4

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type NotificationKind = 'unlock' | 'teaser_30d' | 'teaser_7d' | 'teaser_1d';

export interface NotificationMark {
  kind: NotificationKind;
  date: Date;
}

export interface ScheduledCuriosityNotification {
  kind: NotificationKind;
  scheduledFor: string;
  identifier: string | null;
}

const NOTIFICATION_COPY: Record<NotificationKind, { title: string; body: string }> = {
  teaser_30d: {
    title: 'FutureBoxes',
    body: 'Một gợi ý mới vừa được mở trong hộp tương lai của bạn. ✨',
  },
  teaser_7d: {
    title: 'FutureBoxes',
    body: 'Chỉ còn 7 ngày nữa. Bạn còn nhớ mình đã viết gì không? 🤔',
  },
  teaser_1d: {
    title: 'FutureBoxes',
    body: 'Ngày mai hộp của bạn sẽ mở. Có hồi hộp không? 🎁',
  },
  unlock: {
    title: 'FutureBoxes',
    body: 'Một hộp thời gian đã sẵn sàng mở! 📦',
  },
};

function subtractDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

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
    const kind = response.notification.request.content.data?.kind as NotificationKind | undefined;
    void kind;
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
 * Tính các mốc notification curiosity (teaser_30d/7d/1d) + unlock trước unlockDate.
 * Chỉ giữ mốc strictly trong tương lai so với `now` (AC-31.2).
 * Hàm thuần — không gọi OS, dễ test.
 */
export function computeNotificationMarks(unlockDate: Date, now: Date): NotificationMark[] {
  const nowTime = now.getTime();

  return [
    { kind: 'teaser_30d' as const, date: subtractDays(unlockDate, 30) },
    { kind: 'teaser_7d' as const, date: subtractDays(unlockDate, 7) },
    { kind: 'teaser_1d' as const, date: subtractDays(unlockDate, 1) },
    { kind: 'unlock' as const, date: new Date(unlockDate) },
  ].filter((mark) => mark.date.getTime() > nowTime);
}

export async function scheduleCuriosityNotifications(
  boxId: string,
  unlockDate: Date,
): Promise<ScheduledCuriosityNotification[]> {
  const marks = computeNotificationMarks(unlockDate, new Date());
  const unscheduled = marks.map((mark) => ({
    kind: mark.kind,
    scheduledFor: mark.date.toISOString(),
    identifier: null,
  }));

  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return unscheduled;

    const scheduled: ScheduledCuriosityNotification[] = [];
    for (const mark of marks) {
      let identifier: string | null = null;
      const copy = NOTIFICATION_COPY[mark.kind];

      try {
        identifier = await Notifications.scheduleNotificationAsync({
          content: {
            title: copy.title,
            body: copy.body,
            data: { boxId, kind: mark.kind },
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: mark.date,
          },
        });
      } catch {
        identifier = null;
      }

      scheduled.push({
        kind: mark.kind,
        scheduledFor: mark.date.toISOString(),
        identifier,
      });
    }

    return scheduled;
  } catch {
    return unscheduled;
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
